// ── adigoadmin ────────────────────────────────────────────────────────────────
// WhatsApp skill: Itay-only shortcut for querying Meta Ads performance across
// three ad accounts (Adigo, Lior, Power). Two modes coexist:
//   1. Menu shortcut: "1"/"2"/"3" → "all campaigns today" for that account.
//   2. Free-form NL: any other text is passed through Claude Haiku, which
//      extracts { accounts, timeframe, campaign_filter } and drives the same
//      report path — so "אדיגו החודש", "פאוור אתמול", or even multi-account
//      queries all work.
//
// The pending row (step='admin_await_selection') is KEPT ALIVE after every
// answer so consecutive questions land in admin mode without re-triggering
// "/אדמין". "ביטול" (handled by flow.js) drops out.

import Anthropic from '@anthropic-ai/sdk'
import { getAllCampaignInsights, getAccountCurrency } from './meta-api.js'

// Hard-coded to Itay's Supabase user_id (itay@binder.co.il). Non-admins never
// see the shortcut — isAdminTrigger silently returns false for them.
const ADMIN_USER_ID = '659a14c1-4a8c-4bb3-a90a-203b8b300053'

const ADMIN_ACCOUNTS = [
  { menu: '1', keys: ['adigo', 'אדיגו', 'adi'], name: 'אדיגו', account_id: 'act_1012233651314559' },
  { menu: '2', keys: ['lior', 'ליאור', 'רובין', 'קעקועים', 'tattoo'], name: 'ליאור', account_id: 'act_1026356652124107' },
  { menu: '3', keys: ['power', 'פאוור', 'קאפל', 'couple'], name: 'פאוור', account_id: 'act_700827983681798' },
]

const TIMEFRAMES = {
  today: 'היום',
  yesterday: 'אתמול',
  this_week_sun_today: 'השבוע',
  this_month: 'החודש',
  last_7d: '7 ימים אחרונים',
  last_30d: '30 ימים אחרונים',
  maximum: 'הכל',
}

const ADMIN_MENU_TEXT = `⚡ *פקודות אדמין*

1. אדיגו היום
2. ליאור היום
3. פאוור היום

או כתוב חופשי — למשל:
_"אדיגו החודש"_
_"פאוור אתמול"_
_"ליאור בשבוע האחרון"_

לצאת — שלח "ביטול"`

const anthropicKey = process.env.ANTHROPIC_API_KEY
const anthropic = anthropicKey && anthropicKey !== 'placeholder_add_your_key'
  ? new Anthropic({ apiKey: anthropicKey })
  : null

function findAccount(key) {
  const k = (key ?? '').toLowerCase().trim()
  if (!k) return null
  return ADMIN_ACCOUNTS.find(a => a.menu === k || a.keys.some(x => x.toLowerCase() === k))
}

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
  await send(from, ADMIN_MENU_TEXT)
}

// ── formatting helpers (kept in sync with adigoperf.js) ────────────────────────

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

// ── Claude interpretation of free-form admin requests ─────────────────────────

async function interpretRequest(t) {
  if (!anthropic || !t) return null
  const system = `אתה סוכן שמנתח בקשות בעברית לדוח ביצועי Meta Ads.

חשבונות זמינים (החזר את המפתח המדויק):
- "adigo" (אדיגו)
- "lior" (ליאור / רובין / קעקועים / Tattoo Story)
- "power" (פאוור / קאפל / Power Couple)

טווחי זמן (החזר בדיוק את ה-preset):
- today (היום)
- yesterday (אתמול)
- this_week_sun_today (השבוע)
- this_month (החודש)
- last_7d (7 ימים אחרונים)
- last_30d (30 יום אחרונים / חודש אחרון)
- maximum (הכל / מאז ומעולם)

חלץ JSON בלבד:
{
  "accounts": מערך של מפתחות ("adigo","lior","power"). מרובה = השוואה.
  "timeframe": preset אחד. אם המשתמש לא ציין — שים "today".
  "campaign_filter": מחרוזת חלקית של שם קמפיין (עברית/אנגלית) או null אם רוצה הכל.
  "confidence": "high" אם החשבון מפורש, "low" אחרת.
}

דוגמאות:
"אדיגו החודש" → {"accounts":["adigo"],"timeframe":"this_month","campaign_filter":null,"confidence":"high"}
"פאוור בקמפיין לידים אתמול" → {"accounts":["power"],"timeframe":"yesterday","campaign_filter":"לידים","confidence":"high"}
"מה קרה השבוע" → {"accounts":[],"timeframe":"this_week_sun_today","campaign_filter":null,"confidence":"low"}

החזר JSON בלבד ללא הסברים ובלי code blocks.`
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system,
      messages: [{ role: 'user', content: t }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const clean = text.replace(/```json?\s*/gi, '').replace(/```/g, '').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error('[admin] Claude interpret error:', e.message)
    return null
  }
}

// ── Pull + format one account's perf report ───────────────────────────────────

async function runReport({ send, from, account, tfPreset, tfLabel, campaignFilter, token }) {
  await send(from, `⏳ שולף את ${account.name} — ${tfLabel}...`)
  try {
    const [rows, currency] = await Promise.all([
      getAllCampaignInsights(account.account_id, tfPreset, token),
      getAccountCurrency(account.account_id, token),
    ])
    let filtered = (rows ?? []).filter(r => !isBoostPost(r.campaign_name, r.objective))

    if (campaignFilter) {
      const q = campaignFilter.toLowerCase()
      filtered = filtered.filter(r => (r.campaign_name ?? '').toLowerCase().includes(q))
    }

    const header = `📊 *${account.name} — ${tfLabel}*${campaignFilter ? `\n_חיפוש: "${campaignFilter}"_` : ''}`

    if (!filtered.length) {
      await send(from, `${header}\n\nלא נמצאו נתונים.`)
      return
    }

    filtered.sort((a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0))
    const CAP = 30
    const shown = filtered.slice(0, CAP)
    const totalSpend = filtered.reduce((s, r) => s + Number(r.spend ?? 0), 0)

    const blocks = shown.map(r =>
      campaignBlock(r.campaign_name, r.spend, computeResult(r, r.objective), currency)
    )
    let msg = `${header}\n*סה"כ תקציב:* ${fmtSpend(totalSpend, currency)}\n\n${blocks.join('\n\n')}`
    if (filtered.length > CAP) msg += `\n\n_מוצגים ${CAP} מתוך ${filtered.length} קמפיינים (לפי הוצאה)._`
    await send(from, msg)
  } catch (e) {
    await send(from, `❌ ${account.name}: ${(e.message ?? String(e)).slice(0, 120)}`)
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handleAdminFlow({ supabase, send, from, userId, token, t }) {
  const cleanT = (t ?? '').trim()
  if (!cleanT) return

  // Escape hatch: any other skill trigger drops out of admin mode so the outer
  // flow can pick it up on the next message.
  if (cleanT.startsWith('/') && !isAdminTrigger(userId, cleanT)) {
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    await send(from, '↩️ יצאתי ממצב אדמין. שלח את הפקודה שוב.')
    return
  }

  // Quick menu shortcut: 1/2/3 → account today
  const menuMatch = ADMIN_ACCOUNTS.find(a => a.menu === cleanT)
  if (menuMatch) {
    await runReport({
      send, from, account: menuMatch, tfPreset: 'today',
      tfLabel: TIMEFRAMES.today, campaignFilter: null, token,
    })
    await send(from, `_עוד? כתוב בקשה או "ביטול" לסיום._`)
    return
  }

  // Free-form via Claude
  const parsed = await interpretRequest(cleanT)

  if (!parsed || !Array.isArray(parsed.accounts) || !parsed.accounts.length) {
    await send(from, `❓ לא זיהיתי את החשבון. תוכל לומר "אדיגו", "ליאור" או "פאוור" במפורש.\n\n${ADMIN_MENU_TEXT}`)
    return
  }

  const tfPreset = TIMEFRAMES[parsed.timeframe] ? parsed.timeframe : 'today'
  const tfLabel = TIMEFRAMES[tfPreset]
  const filter = parsed.campaign_filter ?? null

  const accounts = parsed.accounts.map(k => findAccount(k)).filter(Boolean)
  if (!accounts.length) {
    await send(from, `❓ לא זיהיתי חשבון תקין. אפשרויות: אדיגו / ליאור / פאוור.\n\n${ADMIN_MENU_TEXT}`)
    return
  }

  for (const account of accounts) {
    await runReport({ send, from, account, tfPreset, tfLabel, campaignFilter: filter, token })
  }

  await send(from, `_עוד? כתוב בקשה או "ביטול" לסיום._`)
}
