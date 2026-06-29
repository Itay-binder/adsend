// ── adigoperf ─────────────────────────────────────────────────────────────────
// WhatsApp skill: show campaign performance (spend + results) for a timeframe.
// Trigger: the user sends "/ביצועים".
//
// Flow:
//   1. "ביצועים של איזה קמפיין?" → list active campaigns + "כל הקמפיינים".
//   2. Timeframe menu (1..7).
//   3. Results, with WhatsApp-bold (*...*) headers:
//        *שם קמפיין:* ...
//        *תקציב שיצא:* ...
//        *תוצאות:* ...
//      For "all campaigns": one message, a block per campaign + a *סה"כ תקציב:* total.
//
// State in whatsapp_pending (no schema change):
//   step      → 'perf_await_campaign' | 'perf_await_timeframe'
//   intent    → 'perf'
//   cta       → account currency code
//   campaigns → JSON of active campaigns
//   campaign_id / campaign_name → chosen campaign, or 'ALL'
//   headline  → chosen campaign objective (for single)

import {
  getActiveCampaigns, getAccountCurrency,
  getCampaignInsights, getAllCampaignInsights,
} from './meta-api.js'

export function isPerfTrigger(t) {
  const x = (t ?? '').trim().toLowerCase()
  return x === '/ביצועים' || x === 'ביצועים' || x === '/performance'
}

export function isPerfStep(step) {
  return typeof step === 'string' && step.startsWith('perf_')
}

const TIMEFRAMES = {
  '1': { preset: 'today', label: 'היום' },
  '2': { preset: 'yesterday', label: 'אתמול' },
  '3': { preset: 'this_week_sun_today', label: 'השבוע' },
  '4': { preset: 'this_month', label: 'החודש' },
  '5': { preset: 'last_7d', label: '7 ימים אחרונים' },
  '6': { preset: 'last_30d', label: '30 ימים אחרונים' },
  '7': { preset: 'maximum', label: 'מקסימום' },
}

const TIMEFRAME_MENU =
  '1. היום\n2. אתמול\n3. השבוע\n4. החודש\n5. 7 ימים אחרונים\n6. 30 ימים אחרונים\n7. מקסימום'

function currencySymbol(cur) {
  return ({ ILS: '₪', USD: '$', EUR: '€', GBP: '£' })[cur] ?? ''
}

// Insights spend is already in main currency units (decimal string).
function fmtSpend(spend, cur) {
  const n = Number(spend ?? 0)
  const num = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sym = currencySymbol(cur)
  return sym ? `${sym}${num}` : `${num} ${cur ?? ''}`.trim()
}

// Map a campaign objective to the action type(s) that represent its "result",
// in priority order (first match wins → no double counting).
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

export async function handlePerfFlow({ supabase, send, from, userId, token, adAccount, t, pending }) {
  // ── START: "/ביצועים" ────────────────────────────────────────────────────────
  if (isPerfTrigger(t)) {
    let campaigns, currency
    try {
      ;[campaigns, currency] = await Promise.all([
        getActiveCampaigns(adAccount.account_id, token),
        getAccountCurrency(adAccount.account_id, token),
      ])
    } catch (e) {
      await send(from, `❌ שגיאה בטעינת קמפיינים: ${e.message.slice(0, 80)}`)
      return
    }
    if (!campaigns.length) {
      await send(from, '❌ לא נמצאו קמפיינים פעילים בחשבון.')
      return
    }

    const lines = campaigns.map((c, i) => `${i + 1}. 🟢 ${c.name}`)
    lines.push(`${campaigns.length + 1}. 📊 כל הקמפיינים`)

    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, step: 'perf_await_campaign',
      campaigns: JSON.stringify(campaigns), cta: currency, intent: 'perf',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    await send(from, `📊 ביצועים\n\nביצועים של איזה קמפיין?\n\n${lines.join('\n')}\n\nשלח מספר או "ביטול"`)
    return
  }

  const currency = pending?.cta ?? ''

  // ── CHOOSE CAMPAIGN ──────────────────────────────────────────────────────────
  if (pending?.step === 'perf_await_campaign') {
    const campaigns = JSON.parse(pending.campaigns ?? '[]')
    const allIdx = campaigns.length + 1
    const num = parseInt(t)

    let campaignId, campaignName, objective
    if (num === allIdx) {
      campaignId = 'ALL'; campaignName = 'כל הקמפיינים'; objective = ''
    } else if (!isNaN(num) && num >= 1 && num <= campaigns.length) {
      const c = campaigns[num - 1]
      campaignId = c.id; campaignName = c.name; objective = c.objective ?? ''
    } else {
      const c = campaigns.find(x => x.name.toLowerCase().includes(t.toLowerCase()))
      if (!c) {
        await send(from, `❓ לא הבנתי. שלח מספר בין 1 ל-${allIdx}:\n\n${campaigns.map((x, i) => `${i + 1}. 🟢 ${x.name}`).join('\n')}\n${allIdx}. 📊 כל הקמפיינים`)
        return
      }
      campaignId = c.id; campaignName = c.name; objective = c.objective ?? ''
    }

    await supabase.from('whatsapp_pending').update({
      step: 'perf_await_timeframe', campaign_id: campaignId, campaign_name: campaignName, headline: objective,
    }).eq('user_id', userId)

    await send(from, `קמפיין: ${campaignName}\n\nאיזה טווח זמן?\n\n${TIMEFRAME_MENU}\n\nשלח מספר או "ביטול"`)
    return
  }

  // ── CHOOSE TIMEFRAME + SHOW RESULTS ──────────────────────────────────────────
  if (pending?.step === 'perf_await_timeframe') {
    const tf = TIMEFRAMES[(t ?? '').trim()]
    if (!tf) {
      await send(from, `❓ שלח מספר בין 1 ל-7:\n\n${TIMEFRAME_MENU}`)
      return
    }

    await send(from, '⏳ שולף נתונים...')

    try {
      if (pending.campaign_id === 'ALL') {
        const rows = (await getAllCampaignInsights(adAccount.account_id, tf.preset, token))
          .filter(r => !isBoostPost(r.campaign_name, r.objective))
        if (!rows.length) {
          await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
          await send(from, `📊 *ביצועים — כל הקמפיינים* | ${tf.label}\n\nלא נמצאו נתונים בטווח הזה.`)
          return
        }
        rows.sort((a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0))

        const CAP = 30
        const shown = rows.slice(0, CAP)
        const totalSpend = rows.reduce((s, r) => s + Number(r.spend ?? 0), 0)

        const blocks = shown.map(r =>
          campaignBlock(r.campaign_name, r.spend, computeResult(r, r.objective), currency)
        )
        let msg = `📊 *ביצועים — כל הקמפיינים* | ${tf.label}\n*סה"כ תקציב:* ${fmtSpend(totalSpend, currency)}\n\n${blocks.join('\n\n')}`
        if (rows.length > CAP) msg += `\n\n_מוצגים ${CAP} מתוך ${rows.length} קמפיינים (לפי הוצאה)._`

        await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
        await send(from, msg)
      } else {
        const insight = await getCampaignInsights(pending.campaign_id, tf.preset, token)
        await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
        if (!insight) {
          await send(from, `📊 *ביצועים* | ${tf.label}\n\n*שם קמפיין:* ${pending.campaign_name}\n\nאין נתונים בטווח הזה.`)
          return
        }
        const result = computeResult(insight, pending.headline)
        const msg = `📊 *ביצועים* | ${tf.label}\n\n${campaignBlock(pending.campaign_name, insight.spend, result, currency)}`
        await send(from, msg)
      }
    } catch (e) {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, `❌ שגיאה בשליפת הנתונים: ${(e.message ?? String(e)).slice(0, 120)}`)
    }
    return
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  await send(from, 'שלח "/ביצועים" לצפייה בביצועים.')
}
