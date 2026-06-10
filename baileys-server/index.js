import 'dotenv/config'
import express from 'express'
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import pino from 'pino'
import { mkdir, readdir, writeFile, readFile, unlink, rm } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import { handleFlow } from './flow.js'

// Tiny GreenAPI alert helper — used to ping Itay on critical events.
async function sendItayAlert(text) {
  const instance = process.env.GREENAPI_INSTANCE_ID ?? '7105272975'
  const token = process.env.GREENAPI_TOKEN
  if (!token) return
  try {
    await fetch(`https://api.green-api.com/waInstance${instance}/sendMessage/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: '972526660006@c.us', message: text }),
    })
  } catch {}
}

const execFileP = promisify(execFile)

const app = express()
app.use(express.json({ limit: '50mb' }))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const SESSIONS_DIR = './sessions'
const logger = pino({ level: 'warn' })

// In-memory session map: userId → { socket, qr, status, phone }
const sessions = new Map()

// Track user-initiated disconnects (clicks on "Disconnect" button) so we don't
// fire the webhook for those — only WhatsApp-side logouts should notify Itay.
const manualDisconnects = new Set()

const DISCONNECT_WEBHOOK_URL = process.env.DISCONNECT_WEBHOOK_URL ??
  'https://hook.us1.make.com/1hc7evjqr6r6tyq4af2rnjtvi2t795ae'

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

// Resize a video buffer to 1080px wide if it's narrower than 500px. Uses ffmpeg
// which is installed in the Docker image. Preserves aspect ratio (height auto).
async function resizeVideoIfNarrow(buffer, userId) {
  const tmpDir = os.tmpdir()
  const id = `${userId}-${Date.now()}`
  const inPath = path.join(tmpDir, `in-${id}.mp4`)
  const outPath = path.join(tmpDir, `out-${id}.mp4`)
  try {
    await writeFile(inPath, buffer)

    // Probe width + height + rotation. WhatsApp/Meta render the post-rotation
    // dimensions, so we resize when EITHER dimension is below 500px.
    const { stdout } = await execFileP('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-show_entries', 'stream_side_data=rotation',
      '-of', 'json', inPath,
    ])
    let width = 0, height = 0, rotation = 0
    try {
      const info = JSON.parse(stdout)
      const s = info?.streams?.[0]
      width = parseInt(s?.width, 10) || 0
      height = parseInt(s?.height, 10) || 0
      rotation = parseInt(s?.side_data_list?.[0]?.rotation, 10) || 0
    } catch {}

    // After rotation, width and height may swap
    let dispW = width, dispH = height
    if (rotation === 90 || rotation === -90 || rotation === 270) {
      dispW = height; dispH = width
    }

    dlog(`[${userId}] video probe raw=${width}x${height} rot=${rotation} display=${dispW}x${dispH}`)

    if (dispW >= 500) {
      dlog(`[${userId}] video display width ${dispW}px ≥ 500 — no resize`)
      return buffer
    }

    // Scale so DISPLAYED width is 1080 (post-rotation). For portrait videos
    // ffmpeg's scale operates on RAW pixels, so when rotated we set height=1080.
    const isRotated = (rotation === 90 || rotation === -90 || rotation === 270)
    const vf = isRotated
      ? 'scale=trunc(oh/a/2)*2:1080'   // rotated: raw height becomes display width
      : 'scale=1080:trunc(ow/a/2)*2'

    await execFileP('ffmpeg', [
      '-y', '-i', inPath,
      '-vf', vf,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
      '-c:a', 'copy', '-movflags', '+faststart',
      outPath,
    ])
    const resized = await readFile(outPath)
    dlog(`[${userId}] video resized display ${dispW}px → 1080px (${buffer.byteLength}B → ${resized.byteLength}B)`)
    return resized
  } catch (e) {
    dlog(`[${userId}] video resize FAILED (${e.message}) — using original`)
    return buffer
  } finally {
    unlink(inPath).catch(() => {})
    unlink(outPath).catch(() => {})
  }
}

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
    dlog(`[${userId}] connection.update connection=${connection} qr=${qr ? 'yes' : 'no'} err=${lastDisconnect?.error?.message ?? 'none'}`)

    if (qr) {
      const qrImage = await QRCode.toDataURL(qr)
      sessions.set(userId, { ...session, qr: qrImage, status: 'connecting' })
    }

    if (connection === 'open') {
      const phone = sock.user?.id?.split(':')[0] ?? null
      const wasDisconnected = session.status !== 'connected'
      sessions.set(userId, { ...session, qr: null, status: 'connected', phone })
      await supabase.from('whatsapp_sessions').upsert({
        user_id: userId, phone_number: phone, status: 'connected', last_seen: new Date().toISOString()
      }, { onConflict: 'user_id' })
      // Only log a fresh connection event if this isn't a silent reconnect from
      // an already-connected state (Baileys can emit 'open' redundantly).
      if (wasDisconnected) {
        try {
          await supabase.from('events').insert({
            user_id: userId, name: 'whatsapp_reconnected', params: { phone },
          })
        } catch {}
      }
      dlog(`[${userId}] CONNECTED as ${phone}`)
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const reason = lastDisconnect?.error?.message ?? null
      const shouldReconnect = code !== DisconnectReason.loggedOut
      sessions.set(userId, { ...session, status: 'disconnected', qr: null })
      await supabase.from('whatsapp_sessions').upsert({
        user_id: userId, status: 'disconnected', updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

      // Log every disconnect for analytics — but only fire the
      // alerts/email for a real disconnect (loggedOut: user unlinked the
      // device on their phone). Network-blip disconnects auto-reconnect
      // and don't deserve noise.
      try {
        await supabase.from('events').insert({
          user_id: userId, name: 'whatsapp_disconnect',
          params: { code, reason, will_reconnect: shouldReconnect },
        })
      } catch {}

      // Skip the webhook if THIS disconnect was triggered by the customer
      // clicking 'Disconnect' in the UI — that's deliberate, not a problem.
      const wasUserInitiated = manualDisconnects.has(userId)
      if (wasUserInitiated) manualDisconnects.delete(userId)

      if (!shouldReconnect && !wasUserInitiated) {
        try {
          const { data: { user } } = await supabase.auth.admin.getUserById(userId)
          const email = user?.email ?? null
          const name = user?.user_metadata?.full_name ?? null
          const phone = session.phone ?? null

          const payload = {
            event: 'whatsapp_disconnect',
            user_id: userId,
            email,
            name,
            phone: phone ? `+${phone}` : null,
            reason,
            code,
            timestamp: new Date().toISOString(),
          }

          await fetch(DISCONNECT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(e => dlog(`[${userId}] webhook send failed: ${e.message}`))

          await sendItayAlert(
            `📵 Adigo — ווצאפ של לקוח התנתק\n\n` +
            `שם: ${name || '—'}\n` +
            `אימייל: ${email ?? '—'}\n` +
            `מספר: ${phone ? '+' + phone : '—'}\n` +
            `נשלח טריגר ל-Make.`
          )
        } catch (e) {
          dlog(`[${userId}] notify-disconnect failed: ${e.message}`)
        }
      }

      dlog(`[${userId}] DISCONNECTED code=${code} willReconnect=${shouldReconnect}`)
      if (shouldReconnect) {
        // Clear from sessions map so reconnect can run (guard at top of startSession)
        sessions.delete(userId)
        setTimeout(() => startSession(userId), 3000)
      }
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
      // Skip groups, broadcasts, channels, statuses, and newsletters — the bot
      // is for 1:1 chats only. A media message in a WhatsApp group must NOT
      // trigger the upload flow or the bot will reply into the group.
      const remoteJid = msg.key.remoteJid ?? ''
      if (remoteJid.endsWith('@g.us')
          || remoteJid.endsWith('@broadcast')
          || remoteJid.endsWith('@newsletter')
          || remoteJid === 'status@broadcast') {
        dlog(`[${userId}] skip: non-1:1 chat ${remoteJid}`)
        continue
      }
      if (isDuplicate(msg.key.id)) { dlog(`[${userId}] skip: dedup msgId=${msg.key.id}`); continue }
      await handleIncoming(userId, sock, msg)
    }
  })
}

// Unwrap nested message containers (ephemeral/viewOnce/edited/documentWithCaption)
// and skip metadata-only keys (messageContextInfo, senderKeyDistributionMessage).
// Returns { type, content } where content is the actual user-facing message.
function unwrapMessage(message) {
  if (!message) return { type: null, content: null }
  const META_KEYS = new Set(['messageContextInfo', 'senderKeyDistributionMessage'])
  const WRAPPERS = ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'documentWithCaptionMessage', 'editedMessage']

  for (const wrapper of WRAPPERS) {
    if (message[wrapper]?.message) {
      return unwrapMessage(message[wrapper].message)
    }
  }
  const keys = Object.keys(message).filter(k => !META_KEYS.has(k))
  const type = keys[0] ?? null
  return { type, content: type ? message[type] : null }
}

async function handleIncoming(userId, sock, msg) {
  // replyTo = original JID from WhatsApp (works for both @lid and @s.whatsapp.net)
  // identityJid = real phone number JID for whitelist comparison (LID hides real phone)
  const replyTo = msg.key.remoteJid
  const senderPn = msg.key.senderPn ?? msg.key.participantPn
  const identityJid = (replyTo?.endsWith('@lid') && senderPn) ? senderPn : replyTo
  const rawKeys = Object.keys(msg.message ?? {}).join(',')
  const { type: msgType, content: msgContent } = unwrapMessage(msg.message)
  dlog(`[${userId}] IN replyTo=${replyTo} identityJid=${identityJid} rawKeys=[${rawKeys}] msgType=${msgType}`)

  let text = null
  let mediaBuffer = null
  let mediaType = null

  try {
    if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
      text = msgContent?.text ?? (typeof msgContent === 'string' ? msgContent : '') ?? ''
    } else if (msgType === 'imageMessage' || msgType === 'videoMessage') {
      const { downloadMediaMessage } = await import('@whiskeysockets/baileys')
      dlog(`[${userId}] downloading ${msgType}...`)
      // Build a synthetic msg with the unwrapped content so downloadMediaMessage
      // finds the media keys regardless of how WhatsApp wrapped it.
      const downloadMsg = { key: msg.key, message: { [msgType]: msgContent } }
      const buffer = await downloadMediaMessage(
        downloadMsg, 'buffer', {},
        { logger, reuploadRequest: sock.updateMediaMessage }
      )
      let processedBuffer = buffer
      mediaType = msgType === 'imageMessage' ? 'image' : 'video'
      text = msgContent?.caption ?? ''

      if (mediaType === 'image') {
        try {
          const meta = await sharp(buffer).metadata()
          dlog(`[${userId}] image probe ${meta.width}x${meta.height}`)
          if (meta.width && meta.width < 500) {
            processedBuffer = await sharp(buffer).resize(1080, null, { fit: 'inside', withoutEnlargement: false }).toBuffer()
            dlog(`[${userId}] image resized ${meta.width}px → 1080px`)
          } else {
            dlog(`[${userId}] image width ${meta.width}px ≥ 500 — no resize`)
          }
        } catch (e) {
          dlog(`[${userId}] image resize failed: ${e.message}`)
        }
      } else if (mediaType === 'video') {
        processedBuffer = await resizeVideoIfNarrow(buffer, userId)
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

app.delete('/session/:userId', async (req, res) => {
  const { userId } = req.params
  const s = sessions.get(userId)
  // Mark this as user-initiated so the close handler skips the webhook
  manualDisconnects.add(userId)
  try {
    if (s?.socket) {
      try { await s.socket.logout() } catch {}
      try { s.socket.end() } catch {}
    }
    sessions.delete(userId)
    const dir = path.join(SESSIONS_DIR, userId)
    await rm(dir, { recursive: true, force: true }).catch(() => {})
    await supabase.from('whatsapp_sessions').upsert({
      user_id: userId, status: 'disconnected', updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    dlog(`[${userId}] session forcibly disconnected and auth wiped`)
    res.json({ ok: true })
  } catch (e) {
    dlog(`[${userId}] disconnect error: ${e.message}`)
    res.status(500).json({ ok: false, error: e.message })
  }
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

// Re-connect all sessions whose auth files exist in the persistent volume.
// Don't rely on Supabase status — the previous container might have died mid-session
// and never marked itself 'disconnected' (or marked it and we want to restore anyway).
async function restoreActiveSessions() {
  try {
    const dirs = await readdir(SESSIONS_DIR, { withFileTypes: true })
    // Filter out filesystem artifacts (lost+found on ext4) and only restore UUID-shaped dirs
    const userIds = dirs
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .filter(name => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name))
    dlog(`startup: found ${userIds.length} session dir(s) on disk → restoring`)
    for (const userId of userIds) {
      try {
        await startSession(userId)
        dlog(`startup: restored ${userId}`)
      } catch (e) {
        dlog(`startup: failed to restore ${userId}: ${e.message}`)
      }
    }
  } catch (e) {
    dlog(`startup: readdir failed: ${e.message}`)
  }
}

// Hit the Vercel-hosted cart abandonment endpoint every 5 minutes. Lives here
// because Vercel Hobby only allows daily crons — Railway runs 24/7 so this is
// the cheapest place to keep the 5-min cadence.
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://adsend.vercel.app'
const CRON_SECRET = process.env.CRON_SECRET
async function tickCartAbandonment() {
  if (!CRON_SECRET) return
  try {
    const res = await fetch(`${APP_BASE_URL}/api/cron/cart-abandonment`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    const j = await res.json().catch(() => ({}))
    if (j?.alerted > 0) dlog(`cart-abandonment: alerted ${j.alerted}/${j.scanned}`)
  } catch (e) {
    dlog(`cart-abandonment tick failed: ${e.message}`)
  }
}
setInterval(tickCartAbandonment, 5 * 60_000)

const PORT = process.env.PORT ?? 3001
app.listen(PORT, async () => {
  console.log(`Baileys server running on :${PORT}`)
  await restoreActiveSessions()
  // Fire one tick at startup so we don't wait 5 min for the first check.
  tickCartAbandonment()
})
