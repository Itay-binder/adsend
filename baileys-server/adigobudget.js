// ── adigobudget ───────────────────────────────────────────────────────────────
// WhatsApp skill: change the budget of an active campaign (CBO) or ad set (ABO).
// Triggers: "/תקציב" (Hebrew) or "/budget" (English).
//
// All user-facing strings go through T[locale]. Locale is passed in by flow.js
// from user_metadata.locale (default 'he').

import {
  getActiveCampaignsWithBudget, getAdSetsWithBudget,
  updateCampaignBudget, updateAdSetBudget, getAccountCurrency,
} from './meta-api.js'

const T = {
  en: {
    load_campaigns_err: (m) => `❌ Failed to load campaigns: ${m}`,
    no_active_campaigns: '❌ No active campaigns in this account.',
    budget_by_adset: 'budget lives on ad sets',
    budget_daily: 'Daily budget',
    budget_lifetime: 'Lifetime budget',
    header: '💰 Update budget',
    pick_campaign: 'Pick a campaign:',
    send_number: 'Reply with a number or "cancel"',
    campaign_pick_err: (max, list) => `❓ Didn't catch that. Reply with a number between 1 and ${max}:\n\n${list}`,
    campaign_line: (name, label, current) => `Campaign: 🟢 ${name}\nCurrent ${label}: ${current}\n\nWhat's the new ${label}? (e.g. 50)`,
    no_active_adsets: '❌ No active ad sets in this campaign.',
    pick_adset: 'Pick an ad set:',
    adset_line: (name, current, label) => `Ad set: 🟢 ${name}\n${current}\nWhat's the new ${label}? (e.g. 50)`,
    no_budget: 'no budget set',
    amount_err: '❓ Send a valid number (e.g. 50)',
    confirm_header: '🎯 Confirm budget update',
    level_campaign: 'Campaign',
    level_adset: 'Ad set',
    new_budget: 'New',
    confirm_hint: 'Reply "confirm" to apply, "cancel" to abort',
    confirm_wait: 'Reply "confirm" to apply, "cancel" to abort',
    success: '✅ Budget updated!',
    fail: (m) => `❌ Budget update failed: ${m}`,
    fallback: 'Send "/budget" to update a budget, or an image/video to push to Meta Ads.',
    current_label: (label, amount) => `Current ${label}: ${amount}`,
    yes_words: ['confirm', 'yes', 'y', 'ok', '✅'],
  },
  he: {
    load_campaigns_err: (m) => `❌ שגיאה בטעינת קמפיינים: ${m}`,
    no_active_campaigns: '❌ לא נמצאו קמפיינים פעילים בחשבון.',
    budget_by_adset: 'תקציב לפי סדרת מודעות',
    budget_daily: 'תקציב יומי',
    budget_lifetime: 'תקציב כולל',
    header: '💰 עדכון תקציב',
    pick_campaign: 'בחר קמפיין:',
    send_number: 'שלח מספר או "ביטול"',
    campaign_pick_err: (max, list) => `❓ לא הבנתי. שלח מספר בין 1 ל-${max}:\n\n${list}`,
    campaign_line: (name, label, current) => `קמפיין: 🟢 ${name}\n${label} נוכחי: ${current}\n\nמה ${label} המעודכן שתרצה? (לדוגמה: 50)`,
    no_active_adsets: '❌ לא נמצאו סדרות מודעות פעילות בקמפיין הזה.',
    pick_adset: 'בחר סדרת מודעות:',
    adset_line: (name, current, label) => `סדרה: 🟢 ${name}\n${current}\nמה ${label} המעודכן? (לדוגמה: 50)`,
    no_budget: 'ללא תקציב',
    amount_err: '❓ שלח סכום תקין במספרים (לדוגמה: 50)',
    confirm_header: '🎯 אישור עדכון תקציב',
    level_campaign: 'קמפיין',
    level_adset: 'סדרה',
    new_budget: 'חדש:',
    confirm_hint: 'לאישור שלח "מאשר", לביטול "ביטול"',
    confirm_wait: 'לאישור שלח "מאשר", לביטול "ביטול"',
    success: '✅ התקציב עודכן בהצלחה!',
    fail: (m) => `❌ עדכון התקציב נכשל: ${m}`,
    fallback: 'שלח "/תקציב" לעדכון תקציב, או תמונה/סרטון להעלאה ל-Meta Ads.',
    current_label: (label, amount) => `${label} נוכחי: ${amount}`,
    yes_words: ['מאשר', 'כן', 'yes', '✅'],
  },
}

export function isBudgetTrigger(t) {
  const x = (t ?? '').trim().toLowerCase()
  return x === '/תקציב' || x === 'תקציב' || x === '/budget' || x === 'budget'
}

export function isBudgetStep(step) {
  return typeof step === 'string' && step.startsWith('budget_')
}

function currencySymbol(cur) {
  return ({ ILS: '₪', USD: '$', EUR: '€', GBP: '£' })[cur] ?? ''
}

function fmtMoney(minor, cur) {
  const main = (Number(minor) || 0) / 100
  const num = Number.isInteger(main) ? String(main) : main.toFixed(2)
  const sym = currencySymbol(cur)
  return sym ? `${sym}${num}` : `${num} ${cur ?? ''}`.trim()
}

function budgetInfo(obj) {
  if (obj?.daily_budget && Number(obj.daily_budget) > 0) return { field: 'daily_budget', minor: Number(obj.daily_budget) }
  if (obj?.lifetime_budget && Number(obj.lifetime_budget) > 0) return { field: 'lifetime_budget', minor: Number(obj.lifetime_budget) }
  return { field: null, minor: 0 }
}

function budgetLabel(field, s) {
  return field === 'lifetime_budget' ? s.budget_lifetime : s.budget_daily
}

export async function startBudgetFlow({ supabase, send, from, userId, token, adAccount, locale = 'he' }) {
  const s = T[locale]
  let campaigns, currency
  try {
    ;[campaigns, currency] = await Promise.all([
      getActiveCampaignsWithBudget(adAccount.account_id, token),
      getAccountCurrency(adAccount.account_id, token),
    ])
  } catch (e) {
    await send(from, s.load_campaigns_err(e.message.slice(0, 80)))
    return
  }
  if (!campaigns.length) {
    await send(from, s.no_active_campaigns)
    return
  }

  const lines = campaigns.map((c, i) => {
    const { field, minor } = budgetInfo(c)
    const tag = field
      ? `${budgetLabel(field, s)}: ${fmtMoney(minor, currency)}`
      : s.budget_by_adset
    return `${i + 1}. 🟢 ${c.name} (${tag})`
  })

  await supabase.from('whatsapp_pending').upsert({
    user_id: userId, step: 'budget_await_campaign',
    campaigns: JSON.stringify(campaigns), cta: currency, intent: 'budget',
    account_id: adAccount.account_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  await send(from, `${s.header}\n\n${s.pick_campaign}\n\n${lines.join('\n')}\n\n${s.send_number}`)
}

export async function handleBudgetFlow({ supabase, send, from, userId, token, adAccount, t, pending, locale = 'he' }) {
  const s = T[locale]

  if (isBudgetTrigger(t)) {
    await startBudgetFlow({ supabase, send, from, userId, token, adAccount, locale })
    return
  }

  const currency = pending?.cta ?? ''

  // ── CHOOSE CAMPAIGN ──────────────────────────────────────────────────────────
  if (pending?.step === 'budget_await_campaign') {
    const campaigns = JSON.parse(pending.campaigns ?? '[]')
    const idx = parseInt(t) - 1
    const chosen = (!isNaN(idx) && idx >= 0 && idx < campaigns.length)
      ? campaigns[idx]
      : campaigns.find(c => c.name.toLowerCase().includes(t.toLowerCase()))
    if (!chosen) {
      const lines = campaigns.map((c, i) => `${i + 1}. 🟢 ${c.name}`).join('\n')
      await send(from, s.campaign_pick_err(campaigns.length, lines))
      return
    }

    const { field, minor } = budgetInfo(chosen)

    if (field) {
      // CBO — budget lives on the campaign
      await supabase.from('whatsapp_pending').update({
        step: 'budget_await_amount', intent: 'campaign',
        campaign_id: chosen.id, campaign_name: chosen.name, utm: field,
      }).eq('user_id', userId)
      await send(from, s.campaign_line(chosen.name, budgetLabel(field, s), fmtMoney(minor, currency)))
      return
    }

    // ABO — budget lives on the ad sets
    let adsets
    try { adsets = await getAdSetsWithBudget(chosen.id, token) }
    catch (e) { await send(from, `❌ ${e.message.slice(0, 80)}`); return }
    const active = adsets.filter(a => a.status === 'ACTIVE')
    if (!active.length) {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, s.no_active_adsets)
      return
    }

    await supabase.from('whatsapp_pending').update({
      step: 'budget_await_adset', campaign_id: chosen.id, campaign_name: chosen.name,
      adsets: JSON.stringify(active),
    }).eq('user_id', userId)

    const lines = active.map((a, i) => {
      const info = budgetInfo(a)
      const tag = info.field ? `${budgetLabel(info.field, s)}: ${fmtMoney(info.minor, currency)}` : s.no_budget
      return `${i + 1}. 🟢 ${a.name} (${tag})`
    })
    await send(from, `🟢 ${chosen.name}\n\n${s.pick_adset}\n\n${lines.join('\n')}\n\n${s.send_number}`)
    return
  }

  // ── CHOOSE AD SET (ABO) ──────────────────────────────────────────────────────
  if (pending?.step === 'budget_await_adset') {
    const adsets = JSON.parse(pending.adsets ?? '[]')
    const idx = parseInt(t) - 1
    const chosen = (!isNaN(idx) && idx >= 0 && idx < adsets.length)
      ? adsets[idx]
      : adsets.find(a => a.name.toLowerCase().includes(t.toLowerCase()))
    if (!chosen) {
      const lines = adsets.map((a, i) => `${i + 1}. 🟢 ${a.name}`).join('\n')
      await send(from, s.campaign_pick_err(adsets.length, lines))
      return
    }

    const { field, minor } = budgetInfo(chosen)
    const useField = field ?? 'daily_budget'
    await supabase.from('whatsapp_pending').update({
      step: 'budget_await_amount', intent: 'adset',
      adset_id: chosen.id, adset_name: chosen.name, utm: useField,
    }).eq('user_id', userId)

    const current = field ? s.current_label(budgetLabel(useField, s), fmtMoney(minor, currency)) + '\n' : ''
    await send(from, s.adset_line(chosen.name, current, budgetLabel(useField, s)))
    return
  }

  // ── ENTER AMOUNT ─────────────────────────────────────────────────────────────
  if (pending?.step === 'budget_await_amount') {
    const amount = parseFloat((t ?? '').replace(/[^\d.]/g, ''))
    if (!amount || amount <= 0) {
      await send(from, s.amount_err)
      return
    }
    const level = pending.intent
    const name = level === 'campaign' ? pending.campaign_name : pending.adset_name
    const lbl = budgetLabel(pending.utm, s)
    const levelLabel = level === 'campaign' ? s.level_campaign : s.level_adset

    await supabase.from('whatsapp_pending').update({
      step: 'budget_await_confirm', headline: String(amount),
    }).eq('user_id', userId)

    await send(from, `${s.confirm_header}\n${levelLabel}: ${name}\n${s.new_budget} ${lbl}: ${fmtMoney(amount * 100, currency)}\n\n${s.confirm_hint}`)
    return
  }

  // ── CONFIRM ──────────────────────────────────────────────────────────────────
  if (pending?.step === 'budget_await_confirm') {
    if (!s.yes_words.includes((t ?? '').toLowerCase())) {
      await send(from, s.confirm_wait)
      return
    }
    const amount = parseFloat(pending.headline)
    const minor = Math.round(amount * 100)
    const level = pending.intent
    const field = pending.utm || 'daily_budget'
    const name = level === 'campaign' ? pending.campaign_name : pending.adset_name
    const levelLabel = level === 'campaign' ? s.level_campaign : s.level_adset

    try {
      if (level === 'campaign') await updateCampaignBudget(pending.campaign_id, field, minor, token)
      else await updateAdSetBudget(pending.adset_id, field, minor, token)
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, `${s.success}\n${levelLabel}: ${name}\n${budgetLabel(field, s)}: ${fmtMoney(minor, currency)}`)
    } catch (e) {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, s.fail((e.message ?? String(e)).slice(0, 120)))
    }
    return
  }

  await send(from, s.fallback)
}
