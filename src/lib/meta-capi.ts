import crypto from 'crypto'

const PIXEL_ID = '1004023898651075'
const API_VERSION = 'v22.0'
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s.toLowerCase().trim()).digest('hex')
}

export type CapiUserData = {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  externalId?: string    // app's user.id (anonymized via SHA-256 on Meta's side)
  fbp?: string           // _fbp cookie from browser
  fbc?: string           // _fbc cookie from browser (Facebook click ID)
  ipAddress?: string     // user's IP (not the server's)
  userAgent?: string     // user's UA
}

export type CapiEvent = {
  name: string                       // 'Purchase', 'Subscribe', 'Lead', custom name, …
  eventId: string                    // SAME id the browser pixel uses → enables dedup
  user: CapiUserData
  custom?: Record<string, unknown>   // { value, currency, content_name, … }
  eventTimeSec?: number              // Unix seconds; defaults to now
  eventSourceUrl?: string            // URL where the event happened (if known)
}

// Sends one or more events to Meta CAPI. Returns { ok, ... }; never throws.
// Each Meta event must match a browser pixel event by event_id + event_name
// for deduplication to apply.
export async function sendCapiEvents(events: CapiEvent[]) {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  if (!accessToken) return { ok: false, reason: 'no_token' as const }

  const payload = {
    data: events.map(e => {
      const ud: Record<string, string | string[]> = {}
      if (e.user.email)      ud.em = sha256(e.user.email)
      if (e.user.phone)      ud.ph = sha256(e.user.phone.replace(/\D/g, ''))
      if (e.user.firstName)  ud.fn = sha256(e.user.firstName)
      if (e.user.lastName)   ud.ln = sha256(e.user.lastName)
      if (e.user.externalId) ud.external_id = sha256(e.user.externalId)
      if (e.user.fbp)        ud.fbp = e.user.fbp
      if (e.user.fbc)        ud.fbc = e.user.fbc
      if (e.user.ipAddress)  ud.client_ip_address = e.user.ipAddress
      if (e.user.userAgent)  ud.client_user_agent = e.user.userAgent

      return {
        event_name: e.name,
        event_time: e.eventTimeSec ?? Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        event_source_url: e.eventSourceUrl,
        action_source: 'website',
        user_data: ud,
        custom_data: e.custom ?? {},
      }
    }),
  }

  try {
    const res = await fetch(`${GRAPH_URL}?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false as const, error: data?.error?.message ?? `HTTP ${res.status}` }
    return { ok: true as const, data }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

// Convenience: build a deterministic event_id from arbitrary inputs so
// the browser and server can independently compute the same id.
// Usage: makeEventId('Purchase', transactionId)
export function makeEventId(...parts: (string | number | null | undefined)[]): string {
  const safe = parts.filter(Boolean).map(String).join(':')
  return crypto.createHash('sha1').update(safe).digest('hex').slice(0, 24)
}
