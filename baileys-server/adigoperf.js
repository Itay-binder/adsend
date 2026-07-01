// ── adigoperf ─────────────────────────────────────────────────────────────────
// WhatsApp skill: show campaign performance (spend + results) for a timeframe.
// Triggers: "/ביצועים" (Hebrew) or "/performance" (English).
//
// Locale is passed in by flow.js from user_metadata.locale (default 'he').

import {
  getActiveCampaigns, getAccountCurrency,
  getCampaignInsights, getAllCampaignInsights,
} from './meta-api.js'

const T = {
  en: {
    timeframes: {
      today: 'Today', yesterday: 'Yesterday', this_week_sun_today: 'This week',
      this_month: 'This month', last_7d: 'Last 7 days', last_30d: 'Last 30 days',
      maximum: 'Max',
    },
    timeframe_menu: '1. Today\n2. Yesterday\n3. This week\n4. This month\n5. Last 7 days\n6. Last 30 days\n7. Max',
    load_err: (m) => `❌ Failed to load campaigns: ${m}`,
    none: '❌ No active campaigns in this account.',
    header: '📊 Performance',
    which_campaign: "Which campaign's performance?",
    all_campaigns_label: '📊 All campaigns',
    send_number: 'Reply with a number or "cancel"',
    pick_err: (max, list) => `❓ Didn't catch that. Reply with a number between 1 and ${max}:\n\n${list}`,
    campaign_chosen: (name, menu) => `Campaign: ${name}\n\nWhich timeframe?\n\n${menu}\n\nReply with a number or "cancel"`,
    tf_err: (menu) => `❓ Reply with a number 1-7:\n\n${menu}`,
    loading: '⏳ Pulling data...',
    all_header: (label) => `📊 *Performance — all campaigns* | ${label}`,
    single_header: (label) => `📊 *Performance* | ${label}`,
    no_data: 'No data for this timeframe.',
    total_spend: 'Total spend',
    campaign_name_lbl: 'Campaign',
    spend_lbl: 'Spend',
    results_lbl: 'Results',
    truncated: (shown, total) => `_Showing ${shown} of ${total} campaigns (by spend)._`,
    err: (m) => `❌ Failed to pull data: ${m}`,
    fallback: 'Send "/performance" to view performance.',
    all_name: 'All campaigns',
    labels: {
      leads: 'leads', purchases: 'purchases', conversations: 'conversations',
      clicks: 'clicks', installs: 'installs', views: 'views',
      engagement: 'engagement', reach: 'reach',
    },
  },
  he: {
    timeframes: {
      today: 'היום', yesterday: 'אתמול', this_week_sun_today: 'השבוע',
      this_month: 'החודש', last_7d: '7 ימים אחרונים', last_30d: '30 ימים אחרונים',
      maximum: 'מקסימום',
    },
    timeframe_menu: '1. היום\n2. אתמול\n3. השבוע\n4. החודש\n5. 7 ימים אחרונים\n6. 30 ימים אחרונים\n7. מקסימום',
    load_err: (m) => `❌ שגיאה בטעינת קמפיינים: ${m}`,
    none: '❌ לא נמצאו קמפיינים פעילים בחשבון.',
    header: '📊 ביצועים',
    which_campaign: 'ביצועים של איזה קמפיין?',
    all_campaigns_label: '📊 כל הקמפיינים',
    send_number: 'שלח מספר או "ביטול"',
    pick_err: (max, list) => `❓ לא הבנתי. שלח מספר בין 1 ל-${max}:\n\n${list}`,
    campaign_chosen: (name, menu) => `קמפיין: ${name}\n\nאיזה טווח זמן?\n\n${menu}\n\nשלח מספר או "ביטול"`,
    tf_err: (menu) => `❓ שלח מספר בין 1 ל-7:\n\n${menu}`,
    loading: '⏳ שולף נתונים...',
    all_header: (label) => `📊 *ביצועים — כל הקמפיינים* | ${label}`,
    single_header: (label) => `📊 *ביצועים* | ${label}`,
    no_data: 'לא נמצאו נתונים בטווח הזה.',
    total_spend: 'סה"כ תקציב',
    campaign_name_lbl: 'שם קמפיין',
    spend_lbl: 'תקציב שיצא',
    results_lbl: 'תוצאות',
    truncated: (shown, total) => `_מוצגים ${shown} מתוך ${total} קמפיינים (לפי הוצאה)._`,
    err: (m) => `❌ שגיאה בשליפת הנתונים: ${m}`,
    fallback: 'שלח "/ביצועים" לצפייה בביצועים.',
    all_name: 'כל הקמפיינים',
    labels: {
      leads: 'לידים', purchases: 'רכישות', conversations: 'שיחות',
      clicks: 'קליקים', installs: 'התקנות', views: 'צפיות',
      engagement: 'מעורבות', reach: 'חשיפה',
    },
  },
}

const TIMEFRAME_PRESETS = ['today', 'yesterday', 'this_week_sun_today', 'this_month', 'last_7d', 'last_30d', 'maximum']

export function isPerfTrigger(t) {
  const x = (t ?? '').trim().toLowerCase()
  return x === '/ביצועים' || x === 'ביצועים' || x === '/performance' || x === 'performance'
}

export function isPerfStep(step) {
  return typeof step === 'string' && step.startsWith('perf_')
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

function resultSpec(objective, labels) {
  const o = (objective ?? '').toUpperCase()
  if (o.includes('LEAD')) return { types: ['lead', 'onsite_conversion.lead_grouped', 'leadgen_grouped', 'offsite_conversion.fb_pixel_lead'], label: labels.leads }
  if (o.includes('SALES') || o.includes('CONVERSION')) return { types: ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase'], label: labels.purchases }
  if (o.includes('MESSAGE')) return { types: ['onsite_conversion.messaging_conversation_started_7d'], label: labels.conversations }
  if (o.includes('TRAFFIC') || o.includes('LINK_CLICK')) return { types: ['link_click'], label: labels.clicks }
  if (o.includes('APP')) return { types: ['mobile_app_install', 'omni_app_install', 'app_install'], label: labels.installs }
  if (o.includes('VIDEO')) return { types: ['video_view'], label: labels.views }
  if (o.includes('ENGAGEMENT')) return { types: ['post_engagement'], label: labels.engagement }
  if (o.includes('AWARENESS') || o.includes('REACH')) return { types: [], label: labels.reach, useReach: true }
  return { types: ['link_click'], label: labels.clicks }
}

function computeResult(insight, objectiveOverride, labels) {
  const objective = objectiveOverride ?? insight?.objective
  const spec = resultSpec(objective, labels)
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

function campaignBlock(name, spend, result, currency, s) {
  return `*${s.campaign_name_lbl}:* ${name}\n*${s.spend_lbl}:* ${fmtSpend(spend, currency)}\n*${s.results_lbl}:* ${result.count.toLocaleString('en-US')} ${result.label}`
}

export async function startPerfFlow({ supabase, send, from, userId, token, adAccount, locale = 'he' }) {
  const s = T[locale]
  let campaigns, currency
  try {
    ;[campaigns, currency] = await Promise.all([
      getActiveCampaigns(adAccount.account_id, token),
      getAccountCurrency(adAccount.account_id, token),
    ])
  } catch (e) {
    await send(from, s.load_err(e.message.slice(0, 80)))
    return
  }
  if (!campaigns.length) {
    await send(from, s.none)
    return
  }

  const lines = campaigns.map((c, i) => `${i + 1}. 🟢 ${c.name}`)
  lines.push(`${campaigns.length + 1}. ${s.all_campaigns_label}`)

  await supabase.from('whatsapp_pending').upsert({
    user_id: userId, step: 'perf_await_campaign',
    campaigns: JSON.stringify(campaigns), cta: currency, intent: 'perf',
    account_id: adAccount.account_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  await send(from, `${s.header}\n\n${s.which_campaign}\n\n${lines.join('\n')}\n\n${s.send_number}`)
}

export async function handlePerfFlow({ supabase, send, from, userId, token, adAccount, t, pending, locale = 'he' }) {
  const s = T[locale]

  if (isPerfTrigger(t)) {
    await startPerfFlow({ supabase, send, from, userId, token, adAccount, locale })
    return
  }

  const currency = pending?.cta ?? ''

  if (pending?.step === 'perf_await_campaign') {
    const campaigns = JSON.parse(pending.campaigns ?? '[]')
    const allIdx = campaigns.length + 1
    const num = parseInt(t)

    let campaignId, campaignName, objective
    if (num === allIdx) {
      campaignId = 'ALL'; campaignName = s.all_name; objective = ''
    } else if (!isNaN(num) && num >= 1 && num <= campaigns.length) {
      const c = campaigns[num - 1]
      campaignId = c.id; campaignName = c.name; objective = c.objective ?? ''
    } else {
      const c = campaigns.find(x => x.name.toLowerCase().includes(t.toLowerCase()))
      if (!c) {
        const menu = campaigns.map((x, i) => `${i + 1}. 🟢 ${x.name}`).join('\n') + `\n${allIdx}. ${s.all_campaigns_label}`
        await send(from, s.pick_err(allIdx, menu))
        return
      }
      campaignId = c.id; campaignName = c.name; objective = c.objective ?? ''
    }

    await supabase.from('whatsapp_pending').update({
      step: 'perf_await_timeframe', campaign_id: campaignId, campaign_name: campaignName, headline: objective,
    }).eq('user_id', userId)

    await send(from, s.campaign_chosen(campaignName, s.timeframe_menu))
    return
  }

  if (pending?.step === 'perf_await_timeframe') {
    const idx = parseInt((t ?? '').trim())
    const preset = TIMEFRAME_PRESETS[idx - 1]
    if (!preset) {
      await send(from, s.tf_err(s.timeframe_menu))
      return
    }
    const tfLabel = s.timeframes[preset]

    await send(from, s.loading)

    try {
      if (pending.campaign_id === 'ALL') {
        const rows = (await getAllCampaignInsights(adAccount.account_id, preset, token))
          .filter(r => !isBoostPost(r.campaign_name, r.objective))
        if (!rows.length) {
          await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
          await send(from, `${s.all_header(tfLabel)}\n\n${s.no_data}`)
          return
        }
        rows.sort((a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0))

        const CAP = 30
        const shown = rows.slice(0, CAP)
        const totalSpend = rows.reduce((sum, r) => sum + Number(r.spend ?? 0), 0)

        const blocks = shown.map(r =>
          campaignBlock(r.campaign_name, r.spend, computeResult(r, r.objective, s.labels), currency, s)
        )
        let msg = `${s.all_header(tfLabel)}\n*${s.total_spend}:* ${fmtSpend(totalSpend, currency)}\n\n${blocks.join('\n\n')}`
        if (rows.length > CAP) msg += `\n\n${s.truncated(CAP, rows.length)}`

        await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
        await send(from, msg)
      } else {
        const insight = await getCampaignInsights(pending.campaign_id, preset, token)
        await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
        if (!insight) {
          await send(from, `${s.single_header(tfLabel)}\n\n*${s.campaign_name_lbl}:* ${pending.campaign_name}\n\n${s.no_data}`)
          return
        }
        const result = computeResult(insight, pending.headline, s.labels)
        const msg = `${s.single_header(tfLabel)}\n\n${campaignBlock(pending.campaign_name, insight.spend, result, currency, s)}`
        await send(from, msg)
      }
    } catch (e) {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, s.err((e.message ?? String(e)).slice(0, 120)))
    }
    return
  }

  await send(from, s.fallback)
}
