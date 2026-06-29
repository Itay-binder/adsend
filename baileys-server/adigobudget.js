// ── adigobudget ───────────────────────────────────────────────────────────────
// WhatsApp skill: change the budget of an active campaign (CBO) or ad set (ABO).
// Trigger: the user sends "/תקציב".
//
// Flow:
//   1. List active campaigns. In parentheses:
//        - CBO  → the campaign's current daily/total budget
//        - ABO  → "תקציב לפי סדרת מודעות"
//   2. After choosing a campaign:
//        - CBO  → ask for the new budget directly
//        - ABO  → list active ad sets (with each budget in parentheses), then ask
//   3. Send a confirmation with the new budget → wait for "מאשר" / "ביטול"
//   4. Update on Meta and confirm success.
//
// State is kept in the existing `whatsapp_pending` table (no schema change):
//   step      → 'budget_await_campaign' | 'budget_await_adset' | 'budget_await_amount' | 'budget_await_confirm'
//   intent    → 'campaign' | 'adset'         (which level we're updating)
//   utm       → 'daily_budget' | 'lifetime_budget'  (which budget field)
//   cta       → account currency code
//   headline  → the new amount (main units, as string)
//   campaigns / adsets / campaign_* / adset_* → selection context

import {
  getActiveCampaignsWithBudget, getAdSetsWithBudget,
  updateCampaignBudget, updateAdSetBudget, getAccountCurrency,
} from './meta-api.js'

export function isBudgetTrigger(t) {
  const x = (t ?? '').trim().toLowerCase()
  return x === '/תקציב' || x === 'תקציב' || x === '/budget'
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

// Returns { field, minor }. field is null when no budget is set on this object.
function budgetInfo(obj) {
  if (obj?.daily_budget && Number(obj.daily_budget) > 0) return { field: 'daily_budget', minor: Number(obj.daily_budget) }
  if (obj?.lifetime_budget && Number(obj.lifetime_budget) > 0) return { field: 'lifetime_budget', minor: Number(obj.lifetime_budget) }
  return { field: null, minor: 0 }
}

function budgetLabel(field) {
  return field === 'lifetime_budget' ? 'תקציב כולל' : 'תקציב יומי'
}

/**
 * @param {object} ctx
 * @param {import('@supabase/supabase-js').SupabaseClient} ctx.supabase
 * @param {(to: string, text: string) => Promise<void>} ctx.send
 * @param {string} ctx.from
 * @param {string} ctx.userId
 * @param {string} ctx.token         Meta access token
 * @param {object} ctx.adAccount     row from ad_accounts ({ account_id, ... })
 * @param {string} ctx.t             trimmed incoming text
 * @param {object|null} ctx.pending  current whatsapp_pending row
 */
// Start the budget flow from scratch (the "/תקציב" trigger, or after the agency
// account-selection gate picked an account). Lists active campaigns and stores
// the chosen ad account on the pending row so later steps stay on it.
export async function startBudgetFlow({ supabase, send, from, userId, token, adAccount }) {
  let campaigns, currency
  try {
    ;[campaigns, currency] = await Promise.all([
      getActiveCampaignsWithBudget(adAccount.account_id, token),
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

  const lines = campaigns.map((c, i) => {
    const { field, minor } = budgetInfo(c)
    const tag = field
      ? `${budgetLabel(field)}: ${fmtMoney(minor, currency)}`
      : 'תקציב לפי סדרת מודעות'
    return `${i + 1}. 🟢 ${c.name} (${tag})`
  })

  await supabase.from('whatsapp_pending').upsert({
    user_id: userId, step: 'budget_await_campaign',
    campaigns: JSON.stringify(campaigns), cta: currency, intent: 'budget',
    account_id: adAccount.account_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  await send(from, `💰 עדכון תקציב\n\nבחר קמפיין:\n\n${lines.join('\n')}\n\nשלח מספר או "ביטול"`)
}

export async function handleBudgetFlow({ supabase, send, from, userId, token, adAccount, t, pending }) {
  // ── START: "/תקציב" ─────────────────────────────────────────────────────────
  if (isBudgetTrigger(t)) {
    await startBudgetFlow({ supabase, send, from, userId, token, adAccount })
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
      const lines = campaigns.map((c, i) => `${i + 1}. 🟢 ${c.name}`)
      await send(from, `❓ לא הבנתי. שלח מספר בין 1 ל-${campaigns.length}:\n\n${lines.join('\n')}`)
      return
    }

    const { field, minor } = budgetInfo(chosen)

    if (field) {
      // CBO — budget lives on the campaign
      await supabase.from('whatsapp_pending').update({
        step: 'budget_await_amount', intent: 'campaign',
        campaign_id: chosen.id, campaign_name: chosen.name, utm: field,
      }).eq('user_id', userId)
      await send(from, `קמפיין: 🟢 ${chosen.name}\n${budgetLabel(field)} נוכחי: ${fmtMoney(minor, currency)}\n\nמה ${budgetLabel(field)} המעודכן שתרצה? (לדוגמה: 50)`)
      return
    }

    // ABO — budget lives on the ad sets
    let adsets
    try { adsets = await getAdSetsWithBudget(chosen.id, token) }
    catch (e) { await send(from, `❌ שגיאה: ${e.message.slice(0, 80)}`); return }
    const active = adsets.filter(a => a.status === 'ACTIVE')
    if (!active.length) {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, '❌ לא נמצאו סדרות מודעות פעילות בקמפיין הזה.')
      return
    }

    await supabase.from('whatsapp_pending').update({
      step: 'budget_await_adset', campaign_id: chosen.id, campaign_name: chosen.name,
      adsets: JSON.stringify(active),
    }).eq('user_id', userId)

    const lines = active.map((a, i) => {
      const info = budgetInfo(a)
      const tag = info.field ? `${budgetLabel(info.field)}: ${fmtMoney(info.minor, currency)}` : 'ללא תקציב'
      return `${i + 1}. 🟢 ${a.name} (${tag})`
    })
    await send(from, `קמפיין: 🟢 ${chosen.name}\n\nבחר סדרת מודעות:\n\n${lines.join('\n')}\n\nשלח מספר או "ביטול"`)
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
      const lines = adsets.map((a, i) => `${i + 1}. 🟢 ${a.name}`)
      await send(from, `❓ לא הבנתי. שלח מספר בין 1 ל-${adsets.length}:\n\n${lines.join('\n')}`)
      return
    }

    const { field, minor } = budgetInfo(chosen)
    const useField = field ?? 'daily_budget'
    await supabase.from('whatsapp_pending').update({
      step: 'budget_await_amount', intent: 'adset',
      adset_id: chosen.id, adset_name: chosen.name, utm: useField,
    }).eq('user_id', userId)

    const current = field ? `${budgetLabel(useField)} נוכחי: ${fmtMoney(minor, currency)}\n` : ''
    await send(from, `סדרה: 🟢 ${chosen.name}\n${current}\nמה ${budgetLabel(useField)} המעודכן? (לדוגמה: 50)`)
    return
  }

  // ── ENTER AMOUNT ─────────────────────────────────────────────────────────────
  if (pending?.step === 'budget_await_amount') {
    const amount = parseFloat((t ?? '').replace(/[^\d.]/g, ''))
    if (!amount || amount <= 0) {
      await send(from, '❓ שלח סכום תקין במספרים (לדוגמה: 50)')
      return
    }
    const level = pending.intent
    const name = level === 'campaign' ? pending.campaign_name : pending.adset_name
    const lbl = budgetLabel(pending.utm)

    await supabase.from('whatsapp_pending').update({
      step: 'budget_await_confirm', headline: String(amount),
    }).eq('user_id', userId)

    await send(from, `🎯 אישור עדכון תקציב\n${level === 'campaign' ? 'קמפיין' : 'סדרה'}: ${name}\n${lbl} חדש: ${fmtMoney(amount * 100, currency)}\n\nלאישור שלח "מאשר", לביטול "ביטול"`)
    return
  }

  // ── CONFIRM ──────────────────────────────────────────────────────────────────
  if (pending?.step === 'budget_await_confirm') {
    const ok = t === 'מאשר' || t === 'כן' || t.toLowerCase() === 'yes' || t === '✅'
    if (!ok) {
      await send(from, 'לאישור שלח "מאשר", לביטול "ביטול"')
      return
    }
    const amount = parseFloat(pending.headline)
    const minor = Math.round(amount * 100)
    const level = pending.intent
    const field = pending.utm || 'daily_budget'
    const name = level === 'campaign' ? pending.campaign_name : pending.adset_name

    try {
      if (level === 'campaign') await updateCampaignBudget(pending.campaign_id, field, minor, token)
      else await updateAdSetBudget(pending.adset_id, field, minor, token)
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, `✅ התקציב עודכן בהצלחה!\n${level === 'campaign' ? 'קמפיין' : 'סדרה'}: ${name}\n${budgetLabel(field)}: ${fmtMoney(minor, currency)}`)
    } catch (e) {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, `❌ עדכון התקציב נכשל: ${(e.message ?? String(e)).slice(0, 120)}`)
    }
    return
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  await send(from, 'שלח "/תקציב" לעדכון תקציב, או תמונה/סרטון להעלאה ל-Meta Ads.')
}
