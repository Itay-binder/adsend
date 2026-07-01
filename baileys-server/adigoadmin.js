// ── adigoadmin ────────────────────────────────────────────────────────────────
// WhatsApp skill: Itay-only shortcut for pulling today's performance across
// three hard-coded ad accounts (Adigo, Lior, Power).
//
// Trigger: the user sends "/אדמין" (or "אדמין" / "/admin").
//
// Flow:
//   1. Show a 3-item menu.
//   2. User picks 1/2/3 → we pull "all campaigns today" for that account and
//      format the same block-per-campaign report as adigoperf, but pinned to
//      "today" so there's no timeframe question.
//
// State in whatsapp_pending: step = 'admin_await_selection', intent = 'admin'.

import { getAllCampaignInsights, getAccountCurrency } from './meta-api.js'

// Hard-coded to Itay's Supabase user_id (itay@binder.co.il). If a different
// account triggers "/אדמין" — isAdminTrigger returns false and the shortcut
// silently doesn't exist for them, so the message falls through to the normal
// flow (which currently just replies with the generic upload hint).
const ADMIN_USER_ID = '659a14c1-4a8c-4bb3-a90a-203b8b300053'

const ADMIN_ACCOUNTS = {
  '1': { name: 'אדיגו', account_id: 'act_1012233651314559' },
  '2': { name: 'ליאור', account_id: 'act_1026356652124107' },
  '3': { name: 'פאוור', account_id: 'act_700827983681798' },
}

const ADMIN_MENU = '1. אדיגו היום\n2. ליאור היום\n3. פאוור היום'

export function isAdminTrigger(userId, t) {
  if (userId !== ADMIN_USER_ID) return false
  const x = (t ?? '').trim().toLowerCase()
  return x === '/אדמין' || x === 'אדמין' || x === '/admin'
}

export function isAdminStep(step) {
  return step === 'admin_await_selection'
}

export async function startAdminFlow({ supabase, send, from, userId }) {
  await supabase.from('whatsapp_pending').upsert({
    user_id: userId, step: 'admin_await_selection', intent: 'admin',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  await send(from, `⚡ *פקודות אדמין*\n\n${ADMIN_MENU}\n\nשלח מספר או "ביטול"`)
}

function currencySymbol(cur) {
  return ({ ILS: '₪', USD: '$', EUR: '€', GBP: '£' })[cur] ?? ''
}

function fmtSpend(spend, cur) {
  const n = Number(spend ?? 0)
  const num = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sym = currencySymbol(cur)
  return sym ? `${sym}${num}` : `${num} ${cur ?? ''}`.trim()
}

function resultSpec(objective) {
  const o = (objective ?? '').toUpperCase()
  if (o.includes('LEAD')) return { types: ['lead', 'onsite_conversion.lead_grouped', 'leadgen_grouped', 'offsite_conversion.fb_pixel_lead'], label: 'לידים' }
  if (o.includes('SALES') || o.includes('CONVERSION')) return { types: ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase'], label: 'רכישות' }
  if (o.includes('MESSAGE')) return { types: ['onsite_conversion.messaging_conversation_started_7d'], label: 'שיחות' }
  if (o.includes('TRAFFIC') || o.includes('LINK_CLICK')) return { types: ['link_click'], label: 'קליקים' }
  if (o.includes('APP')) return { types: ['mobile_app_install', 'omni_app_install', 'app_install'], label: 'התקנות' }
  if (o.includes('VIDEO')) return { types: ['video_view'], label: 'צפיות' }
  if (o.includes('ENGAGEMENT')) return { types: ['post_engagement'], label: 'מעורבות' }
  if (o.includes('AWARENESS') || o.includes('REACH')) return { types: [], label: 'חשיפה', useReach: true }
  return { types: ['link_click'], label: 'קליקים' }
}

function computeResult(insight, objectiveOverride) {
  const objective = objectiveOverride ?? insight?.objective
  const spec = resultSpec(objective)
  if (spec.useReach) return { count: Math.round(Number(insight?.reach ?? 0)), label: spec.label }
  const map = {}
  for (const a of (insight?.actions ?? [])) map[a.action_type] = Number(a.value ?? 0)
  for (const type of spec.types) {
    if (map[type] != null) return { count: Math.round(map[type]), label: spec.label }
  }
  return { count: 0, label: spec.label }
}

function isBoostPost(name, objective) {
  const n = (name ?? '').toLowerCase()
  return n.startsWith('instagram post') || n.startsWith('facebook post') || (objective ?? '') === 'POST_ENGAGEMENT'
}

function campaignBlock(name, spend, result, currency) {
  return `*שם קמפיין:* ${name}\n*תקציב שיצא:* ${fmtSpend(spend, currency)}\n*תוצאות:* ${result.count.toLocaleString('en-US')} ${result.label}`
}

export async function handleAdminFlow({ supabase, send, from, userId, token, t }) {
  const chosen = ADMIN_ACCOUNTS[(t ?? '').trim()]
  if (!chosen) {
    await send(from, `❓ שלח 1, 2 או 3 (או "ביטול")\n\n${ADMIN_MENU}`)
    return
  }

  await send(from, `⏳ שולף את ${chosen.name} — היום...`)
  await supabase.from('whatsapp_pending').delete().eq('user_id', userId)

  try {
    const [rows, currency] = await Promise.all([
      getAllCampaignInsights(chosen.account_id, 'today', token),
      getAccountCurrency(chosen.account_id, token),
    ])
    const filtered = (rows ?? []).filter(r => !isBoostPost(r.campaign_name, r.objective))
    if (!filtered.length) {
      await send(from, `📊 *${chosen.name} — היום*\n\nלא נמצאו נתונים היום.`)
      return
    }
    filtered.sort((a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0))

    const CAP = 30
    const shown = filtered.slice(0, CAP)
    const totalSpend = filtered.reduce((s, r) => s + Number(r.spend ?? 0), 0)

    const blocks = shown.map(r =>
      campaignBlock(r.campaign_name, r.spend, computeResult(r, r.objective), currency)
    )
    let msg = `📊 *${chosen.name} — היום*\n*סה"כ תקציב:* ${fmtSpend(totalSpend, currency)}\n\n${blocks.join('\n\n')}`
    if (filtered.length > CAP) msg += `\n\n_מוצגים ${CAP} מתוך ${filtered.length} קמפיינים (לפי הוצאה)._`
    await send(from, msg)
  } catch (e) {
    await send(from, `❌ שגיאה בשליפה: ${(e.message ?? String(e)).slice(0, 120)}`)
  }
}
