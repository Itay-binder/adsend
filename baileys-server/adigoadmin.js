// ── adigoadmin ────────────────────────────────────────────────────────────────
// WhatsApp skill: Itay-only conversational assistant for Meta Ads across three
// ad accounts (Adigo, Lior, Power). Runs a real agent loop with Claude Haiku
// as the model and one tool (get_account_performance) that pulls live data.
//
// Modes on the same step 'admin_chat':
//   • "1"/"2"/"3" → keep the classic shortcut (fast path, no API cost)
//   • anything else → sent to the agent, which may call the perf tool 0..N
//     times before answering. Full conversation history is kept in the
//     whatsapp_pending row so the chat is stateful across turns.
//
// "ביטול" (handled by flow.js) drops out.

import Anthropic from '@anthropic-ai/sdk'
import { getAllCampaignInsights, getAccountCurrency } from './meta-api.js'

// Hard-coded to Itay's Supabase user_id (itay@binder.co.il). isAdminTrigger
// silently returns false for anyone else — the skill doesn't exist for them.
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
  last_30d: '30 יום אחרונים',
  maximum: 'הכל',
}

const ADMIN_INTRO = `⚡ *מצב אדמין*

קיצורים מהירים:
1. אדיגו היום
2. ליאור היום
3. פאוור היום

*החלפת שפת פלואו קריאייטיבים:*
4. English 🇺🇸  _(או שלח "english")_
5. עברית 🇮🇱  _(או שלח "עברית")_

או פשוט תשאל אותי כל דבר —
_"מה השווה הכי טוב באדיגו השבוע?"_
_"תסביר לי למה פאוור עוצרת"_

לצאת — "ביטול"`

// Quick locale switches available inside admin mode. When Itay wants to test
// the English upload flow (or flip back), he just types one of these words
// (or the "4" / "5" menu shortcut) and the bot updates his user_metadata.locale
// on the spot — no Supabase dashboard trip needed.
const LOCALE_SWITCH_WORDS = {
  he: ['5', 'עברית', 'hebrew', 'he', 'עב'],
  en: ['4', 'אנגלית', 'english', 'en', 'אנג'],
}

function detectLocaleSwitch(cleanT) {
  const t = cleanT.toLowerCase()
  if (LOCALE_SWITCH_WORDS.en.some(w => t === w)) return 'en'
  if (LOCALE_SWITCH_WORDS.he.some(w => t === w)) return 'he'
  return null
}

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
  return step === 'admin_chat'
}

export async function startAdminFlow({ supabase, send, from, userId }) {
  await supabase.from('whatsapp_pending').upsert({
    user_id: userId, step: 'admin_chat', intent: 'admin',
    campaigns: '[]', // history lives here as JSON turns
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  await send(from, ADMIN_INTRO)
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

// ── Quick shortcut: 1/2/3 → account today ─────────────────────────────────────

async function runQuickReport({ send, from, account, token }) {
  await send(from, `⏳ שולף את ${account.name} — היום...`)
  try {
    const [rows, currency] = await Promise.all([
      getAllCampaignInsights(account.account_id, 'today', token),
      getAccountCurrency(account.account_id, token),
    ])
    const filtered = (rows ?? []).filter(r => !isBoostPost(r.campaign_name, r.objective))

    if (!filtered.length) {
      await send(from, `📊 *${account.name} — היום*\n\nלא נמצאו נתונים.`)
      return
    }

    filtered.sort((a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0))
    const CAP = 30
    const shown = filtered.slice(0, CAP)
    const totalSpend = filtered.reduce((s, r) => s + Number(r.spend ?? 0), 0)

    const blocks = shown.map(r =>
      campaignBlock(r.campaign_name, r.spend, computeResult(r, r.objective), currency)
    )
    let msg = `📊 *${account.name} — היום*\n*סה"כ תקציב:* ${fmtSpend(totalSpend, currency)}\n\n${blocks.join('\n\n')}`
    if (filtered.length > CAP) msg += `\n\n_מוצגים ${CAP} מתוך ${filtered.length} קמפיינים._`
    await send(from, msg)
  } catch (e) {
    await send(from, `❌ ${account.name}: ${(e.message ?? String(e)).slice(0, 120)}`)
  }
}

// ── Agent loop: Claude Haiku with one tool ────────────────────────────────────

const TOOLS = [
  {
    name: 'get_account_performance',
    description: 'שולף נתוני ביצועי קמפיינים אמיתיים מ-Meta Ads בחשבון מוגדר. מחזיר מערך קמפיינים עם שם, הוצאה, יעד, תוצאות (לידים/רכישות/קליקים לפי היעד), חשיפות, ו-reach. השתמש בכלי הזה כל פעם שאיתי שואל על מספרים / ביצועים / תקציבים / תוצאות אמיתיים.',
    input_schema: {
      type: 'object',
      properties: {
        account: {
          type: 'string',
          enum: ['adigo', 'lior', 'power'],
          description: 'איזה חשבון: adigo=אדיגו, lior=ליאור/רובין/קעקועים, power=פאוור/קאפל',
        },
        timeframe: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week_sun_today', 'this_month', 'last_7d', 'last_30d', 'maximum'],
          description: 'טווח הזמן. אם לא צוין — today.',
        },
        campaign_filter: {
          type: 'string',
          description: 'מחרוזת חלקית של שם קמפיין לסינון (אופציונלי). ריק = כל הקמפיינים.',
        },
      },
      required: ['account', 'timeframe'],
    },
  },
]

async function executeTool(name, input, token) {
  if (name === 'get_account_performance') {
    const account = findAccount(input.account)
    if (!account) return { error: `לא זוהה חשבון: ${input.account}` }
    try {
      const [rows, currency] = await Promise.all([
        getAllCampaignInsights(account.account_id, input.timeframe, token),
        getAccountCurrency(account.account_id, token),
      ])
      let filtered = (rows ?? []).filter(r => !isBoostPost(r.campaign_name, r.objective))
      if (input.campaign_filter) {
        const q = input.campaign_filter.toLowerCase()
        filtered = filtered.filter(r => (r.campaign_name ?? '').toLowerCase().includes(q))
      }
      filtered.sort((a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0))
      const CAP = 40
      const shown = filtered.slice(0, CAP)
      const totalSpend = filtered.reduce((s, r) => s + Number(r.spend ?? 0), 0)
      return {
        account: account.name,
        timeframe: input.timeframe,
        currency,
        total_spend: Number(totalSpend.toFixed(2)),
        campaigns_count: filtered.length,
        campaigns_shown: shown.length,
        truncated: filtered.length > CAP,
        campaigns: shown.map(r => {
          const res = computeResult(r, r.objective)
          return {
            name: r.campaign_name,
            objective: r.objective,
            spend: Number(Number(r.spend ?? 0).toFixed(2)),
            result_count: res.count,
            result_label: res.label,
            impressions: Number(r.impressions ?? 0),
            reach: Number(r.reach ?? 0),
          }
        }),
      }
    } catch (e) {
      return { error: (e.message ?? String(e)).slice(0, 200) }
    }
  }
  return { error: `כלי לא ידוע: ${name}` }
}

const AGENT_SYSTEM = `אתה עוזר אישי של איתי בינדר, יזם וקמפיינר ישראלי. אתה מדבר עברית ישירה וחדה בסגנון של איתי — קצר, ללא מילים מיותרות, ללא בירוקרטיה שיווקית.

יש לך גישה לביצועים של 3 חשבונות מודעות שלו:
• adigo (אדיגו) — ה-SaaS שלו
• lior (ליאור / רובין) — קעקועים
• power (פאוור / קאפל) — קורס נדל"ן

יש לך כלי get_account_performance שמושך נתונים אמיתיים מ-Meta Ads. השתמש בו כשאיתי שואל על מספרים, קמפיינים ספציפיים, השוואות, או תוצאות. אחרי שקיבלת נתונים — תסכם אותם באופן ברור: הכי חשוב קודם, מספרים בולטים, פורמט קצר.

לשאלות אסטרטגיות (למשל "האם להעלות תקציב?", "מה עוצר את הקמפיין?", "מה לעשות?") — תן עצה אמיתית מתוך המספרים שראית, לא סיסמאות.

הנחיות פורמט לוואצפ:
- כותרות עם *כוכביות* (bold ב-WhatsApp)
- שורה חדשה במקום bullets
- אל תשתמש ב-markdown headers (# ##)
- מספרים עם ₪
- קצר. עדיף 3 שורות מאשר פסקה

אל תשאל אישור מיותר — אם ברור מה איתי רוצה, פשוט תעשה. אם צריך פרט חסר קריטי — שאל בשורה אחת בלבד.`

async function runAgent({ history, userMessage, token, sendInterim }) {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY חסר')

  const messages = [...history, { role: 'user', content: userMessage }]
  const MAX_ITER = 5

  for (let i = 0; i < MAX_ITER; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: AGENT_SYSTEM,
      tools: TOOLS,
      messages,
    })

    // Preserve the exact assistant content in history so the next turn is valid.
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'tool_use') {
      const toolResults = []
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          if (sendInterim) await sendInterim(block.name, block.input).catch(() => {})
          const result = await executeTool(block.name, block.input, token)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          })
        }
      }
      messages.push({ role: 'user', content: toolResults })
      continue
    }

    const textBlock = response.content.find(b => b.type === 'text')
    return { text: (textBlock?.text ?? '').trim(), messages }
  }

  return { text: '⚠️ יותר מדי איטרציות. נסה בקצרה יותר.', messages }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handleAdminFlow({ supabase, send, from, userId, token, t, pending }) {
  const cleanT = (t ?? '').trim()
  if (!cleanT) return

  // Escape hatch: any other slash command drops out of admin mode.
  if (cleanT.startsWith('/') && !isAdminTrigger(userId, cleanT)) {
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    await send(from, '↩️ יצאתי ממצב אדמין. שלח את הפקודה שוב.')
    return
  }

  const history = safeParseHistory(pending?.campaigns)

  // Quick locale switch (options 4/5, or "english" / "עברית" free text)
  const switchTo = detectLocaleSwitch(cleanT)
  if (switchTo) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { ...user?.user_metadata, locale: switchTo },
    })
    const msg = switchTo === 'en'
      ? '✅ העלאת קריאייטיבים תדבר איתך *באנגלית* מעכשיו.\nשלח תמונה/סרטון לבדיקה. לחזרה — "עברית".'
      : '✅ העלאת קריאייטיבים תדבר איתך *בעברית* מעכשיו.\nשלח תמונה/סרטון לבדיקה. לחזרה — "english".'
    history.push({ role: 'user', content: cleanT })
    history.push({ role: 'assistant', content: `שיניתי את locale של איתי ל-${switchTo}.` })
    await persistHistory(supabase, userId, history)
    await send(from, msg)
    return
  }

  // Quick shortcut: 1/2/3 → account today (no Claude, no cost)
  const menuMatch = ADMIN_ACCOUNTS.find(a => a.menu === cleanT)
  if (menuMatch) {
    await runQuickReport({ send, from, account: menuMatch, token })
    // Feed the shortcut into history so Claude has context if the next turn
    // is a follow-up like "וגם השבוע?".
    history.push({ role: 'user', content: cleanT })
    history.push({ role: 'assistant', content: `הצגתי ל-${menuMatch.name} דוח היום.` })
    await persistHistory(supabase, userId, history)
    await send(from, `_עוד שאלה? כתוב חופשי, או "ביטול" לסיום._`)
    return
  }

  // Agent turn
  const sendInterim = async (toolName, input) => {
    if (toolName === 'get_account_performance') {
      const acc = findAccount(input.account)
      const tf = TIMEFRAMES[input.timeframe] ?? input.timeframe
      const filterHint = input.campaign_filter ? ` (סינון: "${input.campaign_filter}")` : ''
      await send(from, `⏳ שולף ${acc?.name ?? input.account} — ${tf}${filterHint}...`)
    }
  }

  try {
    const { text, messages } = await runAgent({
      history, userMessage: cleanT, token, sendInterim,
    })
    await persistHistory(supabase, userId, messages)
    if (text) await send(from, text)
    else await send(from, '(אין תשובה — נסה לנסח שוב)')
  } catch (e) {
    console.error('[admin agent]', e)
    await send(from, `❌ שגיאה: ${(e.message ?? String(e)).slice(0, 160)}`)
  }
}

function safeParseHistory(raw) {
  try {
    const arr = JSON.parse(raw ?? '[]')
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

async function persistHistory(supabase, userId, messages) {
  // Cap at last 20 turns to keep the pending row small (JSON in text column).
  // A "turn" here is one message; tool_use / tool_result count too.
  const trimmed = messages.slice(-20)
  await supabase.from('whatsapp_pending').update({
    campaigns: JSON.stringify(trimmed),
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)
}
