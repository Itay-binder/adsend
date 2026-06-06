import 'dotenv/config'
import express from 'express'
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import { mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { handleFlow } from './flow.js'

const app = express()
app.use(express.json({ limit: '50mb' }))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const SESSIONS_DIR = './sessions'
const logger = pino({ level: 'warn' })

// In-memory session map: userId → { socket, qr, status, phone }
const sessions = new Map()

// Recent activity buffer for /debug/last (last 100 events)
const debugLog = []
function dlog(line) {
  const stamped = `${new Date().toISOString()} ${line}`
  debugLog.push(stamped)
  if (debugLog.length > 100) debugLog.shift()
  console.log(stamped)
}

// Recently processed message IDs (msgId → timestamp) to dedupe Baileys re-emits
const processedMessages = new Map()
const DEDUP_TTL_MS = 60_000

function isDuplicate(msgId) {
  if (!msgId) return false
  const now = Date.now()
  for (const [id, ts] of processedMessages) {
    if (now - ts > DEDUP_TTL_MS) processedMessages.delete(id)
  }
  if (processedMessages.has(msgId)) return true
  processedMessages.set(msgId, now)
  return false
}

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
    dlog(`[${userId}] messages.upsert type=${type} count=${messages.length}`)
    if (type !== 'notify') {
      dlog(`[${userId}] skip: type=${type} (not notify)`)
      return
    }
    for (const msg of messages) {
      if (msg.key.fromMe) { dlog(`[${userId}] skip: fromMe msgId=${msg.key.id}`); continue }
      if (isDuplicate(msg.key.id)) { dlog(`[${userId}] skip: dedup msgId=${msg.key.id}`); continue }
      await handleIncoming(userId, sock, msg)
    }
  })
}

async function handleIncoming(userId, sock, msg) {
  // replyTo = original JID from WhatsApp (works for both @lid and @s.whatsapp.net)
  // identityJid = real phone number JID for whitelist comparison (LID hides real phone)
  const replyTo = msg.key.remoteJid
  const senderPn = msg.key.senderPn ?? msg.key.participantPn
  const identityJid = (replyTo?.endsWith('@lid') && senderPn) ? senderPn : replyTo
  const msgType = Object.keys(msg.message ?? {})[0]
  dlog(`[${userId}] IN replyTo=${replyTo} identityJid=${identityJid} senderPn=${senderPn} type=${msgType}`)

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
      let processedBuffer = buffer
      mediaType = msgType === 'imageMessage' ? 'image' : 'video'
      text = (msgType === 'imageMessage'
        ? msg.message?.imageMessage?.caption
        : msg.message?.videoMessage?.caption) ?? ''

      if (mediaType === 'image') {
        try {
          const meta = await sharp(buffer).metadata()
          if (meta.width && meta.width < 500) {
            processedBuffer = await sharp(buffer).resize(1080, null, { fit: 'inside', withoutEnlargement: false }).toBuffer()
            console.log(`[${userId}] image resized from ${meta.width}px to 1080px`)
          }
        } catch (e) {
          console.warn(`[${userId}] resize failed, using original:`, e.message)
        }
      }

      mediaBuffer = processedBuffer.toString('base64')
      console.log(`[${userId}] ${mediaType} ready, size=${processedBuffer.byteLength}B`)
    } else {
      return
    }
  } catch (err) {
    console.error(`[${userId}] handleIncoming error:`, err.message)
    try {
      const s = sessions.get(userId)
      if (s?.socket && s.status === 'connected') {
        await s.socket.sendMessage(replyTo, { text: '❌ שגיאה בהורדת המדיה. נסה שוב.' })
      }
    } catch {}
    return
  }

  // send always replies to the original JID (LID or s.whatsapp.net) — Baileys handles both
  const send = async (_unused, body) => {
    try { await sock.sendMessage(replyTo, { text: body }) }
    catch (e) { console.error(`[${userId}] send failed:`, e.message) }
  }

  try {
    dlog(`[${userId}] FLOW start messageType=${mediaType ?? 'text'} textLen=${(text ?? '').length}`)
    await handleFlow({
      supabase, send,
      body: { userId, from: identityJid, messageType: mediaType ?? 'text', text, mediaBuffer, mediaType },
    })
    dlog(`[${userId}] FLOW end`)
  } catch (err) {
    dlog(`[${userId}] FLOW ERROR: ${err.message}`)
    console.error(err.stack)
    try { await sock.sendMessage(replyTo, { text: `❌ שגיאה: ${err.message?.slice(0, 200)}` }) } catch {}
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

app.get('/debug/last', (_, res) => res.type('text/plain').send(debugLog.join('\n')))

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
