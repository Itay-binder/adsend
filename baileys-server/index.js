import 'dotenv/config'
import express from 'express'
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import { readdir, mkdir } from 'fs/promises'
import path from 'path'

const app = express()
app.use(express.json({ limit: '50mb' }))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const WEBHOOK_URL = process.env.NEXT_APP_URL + '/api/whatsapp/webhook'
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET
const SESSIONS_DIR = './sessions'
const logger = pino({ level: 'warn' })

// In-memory session map: userId → { socket, qr, status, phone }
const sessions = new Map()

await mkdir(SESSIONS_DIR, { recursive: true })

async function startSession(userId) {
  if (sessions.get(userId)?.status === 'connected') return

  const sessionDir = path.join(SESSIONS_DIR, userId)
  await mkdir(sessionDir, { recursive: true })
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({ version, auth: state, logger, printQRInTerminal: false })
  sessions.set(userId, { socket: sock, qr: null, status: 'connecting', phone: null })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    const session = sessions.get(userId) ?? {}

    if (qr) {
      const qrImage = await QRCode.toDataURL(qr)
      sessions.set(userId, { ...session, qr: qrImage, status: 'connecting' })
    }

    if (connection === 'open') {
      const phone = sock.user?.id?.split(':')[0] ?? null
      sessions.set(userId, { ...session, qr: null, status: 'connected', phone })
      await supabase.from('whatsapp_sessions').upsert({
        user_id: userId, phone_number: phone, status: 'connected', last_seen: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      sessions.set(userId, { ...session, status: 'disconnected', qr: null })
      await supabase.from('whatsapp_sessions').upsert({
        user_id: userId, status: 'disconnected', updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (shouldReconnect) setTimeout(() => startSession(userId), 5000)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      await handleIncoming(userId, sock, msg)
    }
  })
}

async function handleIncoming(userId, sock, msg) {
  const from = msg.key.remoteJid
  const msgType = Object.keys(msg.message ?? {})[0]

  let text = null
  let mediaBuffer = null
  let mediaType = null

  try {
    if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
      text = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text ?? ''
    } else if (msgType === 'imageMessage' || msgType === 'videoMessage') {
      const { downloadMediaMessage } = await import('@whiskeysockets/baileys')
      console.log(`[${userId}] downloading ${msgType}...`)
      const buffer = await downloadMediaMessage(
        msg, 'buffer', {},
        { logger, reuploadRequest: sock.updateMediaMessage }
      )
      mediaBuffer = buffer.toString('base64')
      mediaType = msgType === 'imageMessage' ? 'image' : 'video'
      text = (msgType === 'imageMessage'
        ? msg.message?.imageMessage?.caption
        : msg.message?.videoMessage?.caption) ?? ''
      console.log(`[${userId}] ${mediaType} downloaded, size=${buffer.byteLength}B`)
    } else {
      return
    }
  } catch (err) {
    console.error(`[${userId}] handleIncoming error:`, err.message)
    // Try to notify user about the error
    try {
      const s = sessions.get(userId)
      if (s?.socket && s.status === 'connected') {
        await s.socket.sendMessage(from, { text: '❌ שגיאה בהורדת המדיה. נסה שוב.' })
      }
    } catch {}
    return
  }

  try {
    console.log(`[${userId}] calling webhook, mediaType=${mediaType}, bodySize=${mediaBuffer ? Math.round(mediaBuffer.length/1024)+'KB' : '0'}`)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': WEBHOOK_SECRET },
      body: JSON.stringify({ userId, from, messageType: mediaType ?? 'text', text, mediaBuffer, mediaType }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    console.log(`[${userId}] webhook response: ${res.status}`)
  } catch (err) {
    console.error(`[${userId}] webhook call failed:`, err.message)
  }
}

// ── REST API ─────────────────────────────────────────────
app.get('/session/:userId/status', (req, res) => {
  const s = sessions.get(req.params.userId)
  if (!s) return res.json({ status: 'disconnected' })
  res.json({ status: s.status, phone: s.phone, qr: s.qr })
})

app.post('/session/:userId/start', async (req, res) => {
  const { userId } = req.params
  await startSession(userId)
  const s = sessions.get(userId)
  res.json({ status: s?.status, qr: s?.qr })
})

app.post('/session/:userId/send', async (req, res) => {
  const { userId } = req.params
  const { to, text } = req.body
  const s = sessions.get(userId)
  if (!s?.socket || s.status !== 'connected') return res.json({ ok: false, error: 'not connected' })
  await s.socket.sendMessage(to, { text })
  res.json({ ok: true })
})

// Start session with phone number pairing (no QR needed)
app.post('/session/:userId/pairing-code', async (req, res) => {
  const { userId } = req.params
  const { phone } = req.body // e.g. "972526660006"
  if (!phone) return res.status(400).json({ ok: false, error: 'phone required' })

  const existing = sessions.get(userId)
  if (existing?.status === 'connected') return res.json({ ok: false, error: 'already connected' })

  // Start session if not already connecting
  if (!existing || existing.status === 'disconnected') {
    await startSession(userId)
    // Give socket a moment to initialize
    await new Promise(r => setTimeout(r, 1500))
  }

  const s = sessions.get(userId)
  if (!s?.socket) return res.status(500).json({ ok: false, error: 'session not started' })

  try {
    const code = await s.socket.requestPairingCode(phone.replace(/\D/g, ''))
    res.json({ ok: true, code })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get('/health', (_, res) => res.json({ ok: true, sessions: sessions.size }))

// Re-connect all known sessions on startup
async function restoreActiveSessions() {
  const { data } = await supabase.from('whatsapp_sessions').select('user_id').eq('status', 'connected')
  if (data) {
    for (const row of data) {
      await startSession(row.user_id)
    }
  }
}

const PORT = process.env.PORT ?? 3001
app.listen(PORT, async () => {
  console.log(`Baileys server running on :${PORT}`)
  await restoreActiveSessions()
})
