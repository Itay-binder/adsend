import { parseAdIntent } from './parse-intent.js'
import {
  getActiveCampaigns, getAdSets,
  uploadImageCreative, uploadVideoCreative,
  buildAndCreateAd, activateAd,
} from './meta-api.js'
import { isBudgetTrigger, isBudgetStep, handleBudgetFlow, startBudgetFlow } from './adigobudget.js'
import { isPerfTrigger, isPerfStep, handlePerfFlow, startPerfFlow } from './adigoperf.js'

function buildCampaignMenu(campaigns) {
  return campaigns.map((c, i) => `${i + 1}. 🟢 ${c.name}`).join('\n')
}

function buildAccountMenu(accounts) {
  return accounts.map((a, i) => `${i + 1}. ${a.account_name}`).join('\n')
}

/**
 * Kick off a media upload once the ad account is known. Lists active campaigns,
 * tries to auto-match a campaign from the caption, and parks the flow on
 * `await_campaign` / `await_adset`. Used both for a fresh media message and when
 * resuming after the agency account-selection gate.
 */
async function startUploadFlow({ supabase, send, from, userId, token, adAccount, mediaBuffer, mediaType, caption }) {
  const t = (caption ?? '').trim()
  let campaigns
  try {
    campaigns = await getActiveCampaigns(adAccount.account_id, token)
    if (!campaigns.length) {
      await send(from, '❌ לא נמצאו קמפיינים פעילים בחשבון.')
      return
    }
  } catch (e) {
    await send(from, `❌ שגיאה בטעינת קמפיינים: ${e.message.slice(0, 80)}`)
    return
  }

  const intent = await parseAdIntent(t, campaigns.map(c => ({ id: c.id, name: c.name, adsets: [] })))
  const matchedCampaign = intent.campaign_hint
    ? campaigns.find(c => c.name.toLowerCase().includes(intent.campaign_hint.toLowerCase()))
    : null

  if (matchedCampaign) {
    let adsets
    try { adsets = await getAdSets(matchedCampaign.id, token) }
    catch (e) { await send(from, `❌ שגיאה: ${e.message.slice(0, 80)}`); return }

    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, media_base64: mediaBuffer, media_type: mediaType,
      step: 'await_adset', intent: 'upload', campaigns: JSON.stringify(campaigns),
      campaign_id: matchedCampaign.id, campaign_name: matchedCampaign.name,
      adsets: JSON.stringify(adsets), account_id: adAccount.account_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const type = mediaType === 'image' ? 'תמונה' : 'סרטון'
    await send(from, `קיבלתי ${type}.\nקמפיין: 🟢 ${matchedCampaign.name}\n\nלאיזה סדרת מודעות?\n\n${buildAdSetMenu(adsets)}\n\nשלח מספר או "ביטול"`)
  } else {
    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, media_base64: mediaBuffer, media_type: mediaType,
      step: 'await_campaign', intent: 'upload', campaigns: JSON.stringify(campaigns),
      account_id: adAccount.account_id, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const type = mediaType === 'image' ? 'תמונה' : 'סרטון'
    await send(from, `קיבלתי ${type}.\n\n${buildCampaignMenu(campaigns)}\n\nלאיזה קמפיין? (שלח מספר או "ביטול")`)
  }
}

function buildAdSetMenu(adsets) {
  const lines = adsets.map((a, i) => `${i + 1}. ${a.status === 'ACTIVE' ? '🟢' : '⚫'} ${a.name}`)
  lines.push(`${adsets.length + 1}. כל הסדרות הפעילות`)
  lines.push(`${adsets.length + 2}. כל הסדרות (כולל כבויות)`)
  return lines.join('\n')
}

function assetName() {
  const now = new Date()
  const d = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).split('.').reverse().join('-')
  const t = now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false })
  return `העלאה מווצאפ | ${d} | ${t}`
}

function normPhone(s) {
  return (s ?? '').split(':')[0].split('@')[0].replace(/\D/g, '').replace(/^0+/, '')
}

/**
 * Main flow handler — replaces the old POST /api/whatsapp/webhook route.
 * Runs in-process on the Baileys server, called directly from handleIncoming.
 *
 * @param {object} ctx
 * @param {import('@supabase/supabase-js').SupabaseClient} ctx.supabase
 * @param {(to: string, text: string) => Promise<void>} ctx.send
 * @param {object} ctx.body — { userId, from, messageType, text, mediaBuffer, mediaType }
 */
export async function handleFlow({ supabase, send, body }) {
  const { userId, from, messageType, text, mediaBuffer, mediaType } = body

  // Parallel: fetch everything we'll need up front
  const [
    { data: allowedNumbers },
    { data: sub },
    { data: metaConn },
    { data: adAccounts },
    { data: pending },
  ] = await Promise.all([
    supabase.from('whatsapp_allowed_numbers').select('phone_number').eq('user_id', userId),
    supabase.from('subscriptions').select('status, current_period_end, tier').eq('user_id', userId).maybeSingle(),
    supabase.from('meta_connections').select('access_token').eq('user_id', userId).maybeSingle(),
    supabase.from('ad_accounts').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('whatsapp_pending').select('*').eq('user_id', userId).maybeSingle(),
  ])

  // ── WHITELIST ──────────────────────────────────────────────────────────────
  if (allowedNumbers && allowedNumbers.length > 0) {
    const fromNorm = normPhone(from)
    const isAllowed = allowedNumbers.some(n => {
      const stored = normPhone(n.phone_number)
      return fromNorm.endsWith(stored) || stored.endsWith(fromNorm)
    })
    if (!isAllowed) return
  }

  // ── UPLOAD LIMIT ───────────────────────────────────────────────────────────
  if (messageType === 'image' || messageType === 'video') {
    if (sub?.status === 'expired') {
      await send(from, '❌ המנוי שלך פג תוקף. כנס ל-adsend.vercel.app לחידוש.')
      return
    }
    const isCancelledExpired = sub?.status === 'cancelled' && sub.current_period_end && new Date(sub.current_period_end) < new Date()
    if (isCancelledExpired) {
      await send(from, '❌ המנוי שלך פג תוקף. כנס ל-adsend.vercel.app לחידוש.')
      return
    }
    if (sub && ['active', 'trial', 'cancelled'].includes(sub.status)) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count } = await supabase.from('uploads').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', monthStart)
      if ((count ?? 0) >= 100) {
        await send(from, '❌ הגעת למגבלת 100 העלאות החודש. לרכישת מנוי נוסף — כנס לadsend.vercel.app')
        return
      }
    }
  }

  if (!metaConn) {
    await send(from, '❌ לא מחובר למטא. כנס ל-adsend.vercel.app ותחבר חשבון.')
    return
  }
  if (!adAccounts?.length) {
    await send(from, '❌ לא נמצאו חשבונות מודעות. כנס לאפליקציה וחבר חשבון.')
    return
  }

  const token = metaConn.access_token
  const t = (text ?? '').trim()

  // ── AGENCY ACCOUNT SELECTION ─────────────────────────────────────────────────
  // Agency subscribers can connect several ad accounts. When more than one is
  // connected, every new command first asks which account it applies to; the
  // choice is then locked onto the pending row (account_id) for the rest of the
  // flow. Basic subscribers (and agencies with a single account) skip all this.
  const isAgency = sub?.tier === 'agency'
  const needAccountChoice = isAgency && adAccounts.length > 1
  const adAccount =
    adAccounts.find(a => a.account_id === pending?.account_id) ?? adAccounts[0]

  const askForAccount = async (queuedIntent, extra = {}) => {
    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, step: 'await_account', intent: queuedIntent,
      ...extra, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    await send(from, `🗂️ לאיזה חשבון מודעות?\n\n${buildAccountMenu(adAccounts)}\n\nשלח מספר או "ביטול"`)
  }

  // ── ACTIVATE ───────────────────────────────────────────────────────────────
  if (pending?.step === 'await_activation' && (t === 'מאשר' || t === 'כן' || t === 'yes')) {
    const adIds = JSON.parse(pending.campaigns ?? '[]')
    const results = []
    const errors = []
    for (const adId of adIds) {
      try { await activateAd(adId, token); results.push(adId) }
      catch (e) { errors.push(e.message.slice(0, 80)) }
    }
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    let msg = results.length ? `✅ ${results.length} מודעות הופעלו!` : '⚠️ לא הצלחתי להפעיל.'
    if (errors.length) msg += `\n\nשגיאות:\n${errors.map(e => `• ${e}`).join('\n')}`
    await send(from, msg)
    return
  }

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  if (pending && (t === 'ביטול' || t.toLowerCase() === 'cancel')) {
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    await send(from, '↩️ בוטל.')
    return
  }

  // ── AGENCY: ACCOUNT SELECTION GATE ───────────────────────────────────────────
  // User is answering "which ad account?". Resolve the choice, lock it in, and
  // resume whatever command was queued (upload / budget / perf).
  if (pending?.step === 'await_account') {
    const idx = parseInt(t) - 1
    const chosen = (!isNaN(idx) && idx >= 0 && idx < adAccounts.length)
      ? adAccounts[idx]
      : adAccounts.find(a => a.account_name.toLowerCase().includes(t.toLowerCase()))
    if (!chosen) {
      await send(from, `❓ לא הבנתי. בחר חשבון מודעות (שלח מספר):\n\n${buildAccountMenu(adAccounts)}\n\nאו "ביטול"`)
      return
    }
    const queued = pending.intent
    if (queued === 'budget') {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await startBudgetFlow({ supabase, send, from, userId, token, adAccount: chosen })
      return
    }
    if (queued === 'perf') {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await startPerfFlow({ supabase, send, from, userId, token, adAccount: chosen })
      return
    }
    // upload — media + caption were stashed on the pending row
    await startUploadFlow({
      supabase, send, from, userId, token, adAccount: chosen,
      mediaBuffer: pending.media_base64, mediaType: pending.media_type,
      caption: pending.primary_text ?? '',
    })
    return
  }

  // ── BUDGET SKILL (adigobudget): trigger "/תקציב" or continue a budget flow ────
  if (isBudgetTrigger(t)) {
    if (needAccountChoice) { await askForAccount('budget'); return }
    await handleBudgetFlow({ supabase, send, from, userId, token, adAccount, t, pending })
    return
  }
  if (isBudgetStep(pending?.step)) {
    await handleBudgetFlow({ supabase, send, from, userId, token, adAccount, t, pending })
    return
  }

  // ── PERFORMANCE SKILL (adigoperf): trigger "/ביצועים" or continue the flow ────
  if (isPerfTrigger(t)) {
    if (needAccountChoice) { await askForAccount('perf'); return }
    await handlePerfFlow({ supabase, send, from, userId, token, adAccount, t, pending })
    return
  }
  if (isPerfStep(pending?.step)) {
    await handlePerfFlow({ supabase, send, from, userId, token, adAccount, t, pending })
    return
  }

  // ── NEW MEDIA ──────────────────────────────────────────────────────────────
  if (messageType === 'image' || messageType === 'video') {
    // Agency with several accounts: stash the media and ask which account first.
    if (needAccountChoice) {
      const type = mediaType === 'image' ? 'תמונה' : 'סרטון'
      await supabase.from('whatsapp_pending').upsert({
        user_id: userId, step: 'await_account', intent: 'upload',
        media_base64: mediaBuffer, media_type: mediaType,
        primary_text: t || null, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      await send(from, `קיבלתי ${type}.\n\n🗂️ לאיזה חשבון מודעות?\n\n${buildAccountMenu(adAccounts)}\n\nשלח מספר או "ביטול"`)
      return
    }
    await startUploadFlow({ supabase, send, from, userId, token, adAccount, mediaBuffer, mediaType, caption: t })
    return
  }

  // ── FLOW STEPS ─────────────────────────────────────────────────────────────
  if (!pending) {
    await send(from, '👋 שלח תמונה או סרטון להעלאה ל-Meta Ads')
    return
  }

  if (pending.step === 'await_campaign') {
    const campaigns = JSON.parse(pending.campaigns ?? '[]')
    const idx = parseInt(t) - 1
    const chosen = (!isNaN(idx) && idx >= 0 && idx < campaigns.length)
      ? campaigns[idx]
      : campaigns.find(c => c.name.toLowerCase().includes(t.toLowerCase()))
    if (!chosen) {
      await send(from, `❓ לא הבנתי. שלח מספר בין 1 ל-${campaigns.length}:\n\n${buildCampaignMenu(campaigns)}`)
      return
    }
    let adsets
    try { adsets = await getAdSets(chosen.id, token) }
    catch (e) { await send(from, `❌ שגיאה: ${e.message.slice(0, 80)}`); return }
    await supabase.from('whatsapp_pending').update({
      step: 'await_adset', campaign_id: chosen.id, campaign_name: chosen.name, adsets: JSON.stringify(adsets),
    }).eq('user_id', userId)
    await send(from, `קמפיין: 🟢 ${chosen.name}\n\nלאיזה סדרת מודעות?\n\n${buildAdSetMenu(adsets)}\n\nשלח מספר או "ביטול"`)
    return
  }

  if (pending.step === 'await_adset') {
    const adsets = JSON.parse(pending.adsets ?? '[]')
    const allActiveIdx = adsets.length + 1
    const allIdx = adsets.length + 2
    const num = parseInt(t)
    let selectedIds, label

    if (num === allActiveIdx) {
      selectedIds = adsets.filter(a => a.status === 'ACTIVE').map(a => a.id)
      label = 'כל הסדרות הפעילות'
    } else if (num === allIdx) {
      selectedIds = adsets.map(a => a.id)
      label = 'כל הסדרות (כולל כבויות)'
    } else if (!isNaN(num) && num >= 1 && num <= adsets.length) {
      selectedIds = [adsets[num - 1].id]
      label = adsets[num - 1].name
    } else {
      const found = adsets.find(a => a.name.toLowerCase().includes(t.toLowerCase()))
      if (!found) {
        await send(from, `❓ לא הבנתי. שלח מספר בין 1 ל-${allIdx}:\n\n${buildAdSetMenu(adsets)}`)
        return
      }
      selectedIds = [found.id]
      label = found.name
    }

    if (!selectedIds.length) {
      await send(from, '⚠️ לא נמצאו סדרות בבחירה זו. נסה שוב.')
      return
    }

    await supabase.from('whatsapp_pending').update({
      step: 'await_extra', adset_id: selectedIds.join(','), adset_name: label,
    }).eq('user_id', userId)
    await send(from, `סדרה: ${label}\n\nיש הערות? (לינק אחר, טקסט)\nאם לא — שלח "לא"`)
    return
  }

  if (pending.step === 'await_extra') {
    const extra = (t === 'לא' || t === 'no') ? '' : t
    const urlMatch = extra.match(/https?:\/\/\S+/)
    const overrideUrl = urlMatch ? urlMatch[0] : null
    const overrideCopy = extra ? (extra.replace(/https?:\/\/\S+/g, '').trim() || null) : null
    const type = pending.media_type === 'image' ? 'תמונה' : 'סרטון'

    let confirmMsg = `🎯 סיכום:\n📁 קמפיין: ${pending.campaign_name}\n📂 סדרה: ${pending.adset_name}\n📎 סוג: ${type}`
    if (overrideUrl) confirmMsg += `\n🔗 לינק: ${overrideUrl}`
    if (overrideCopy) confirmMsg += `\n📝 טקסט: ${overrideCopy}`
    confirmMsg += `\n\nמאשר? (כן / ביטול)`

    await supabase.from('whatsapp_pending').update({
      step: 'await_confirmation', primary_text: overrideCopy, destination_url: overrideUrl,
    }).eq('user_id', userId)
    await send(from, confirmMsg)
    return
  }

  if (pending.step === 'await_confirmation' && (t === 'כן' || t === 'מאשר' || t === 'yes' || t === '✅')) {
    await supabase.from('whatsapp_pending').update({ step: 'uploading' }).eq('user_id', userId)
    await send(from, '⏳ מעלה...')

    const selectedIds = (pending.adset_id ?? '').split(',').filter(Boolean)
    const name = assetName()

    try {
      let asset
      if (pending.media_type === 'image') {
        const hash = await uploadImageCreative(adAccount.account_id, Buffer.from(pending.media_base64, 'base64'), token)
        asset = { type: 'image', hash }
      } else {
        const videoId = await uploadVideoCreative(adAccount.account_id, Buffer.from(pending.media_base64, 'base64'), token)
        asset = { type: 'video', videoId }
      }

      const results = []
      const errors = []

      for (const adSetId of selectedIds) {
        try {
          const adId = await buildAndCreateAd(
            adAccount.account_id, adSetId, name, asset,
            { link: pending.destination_url ?? undefined, message: pending.primary_text ?? undefined },
            token, pending.campaign_name ?? ''
          )
          results.push(adId)

          await supabase.from('uploads').insert({
            user_id: userId, ad_account_id: adAccount.id,
            campaign_id: pending.campaign_id, campaign_name: pending.campaign_name,
            adset_id: adSetId, adset_name: pending.adset_name,
            meta_ad_id: adId, media_type: pending.media_type,
            primary_text: pending.primary_text, destination_url: pending.destination_url,
            status: 'PAUSED',
          })
          try {
            await supabase.from('events').insert({
              user_id: userId, name: 'upload_created',
              params: {
                media_type: pending.media_type,
                campaign_name: pending.campaign_name,
                adset_name: pending.adset_name,
                meta_ad_id: adId,
              },
            })
          } catch {}
        } catch (e) {
          const msg = e.message ?? String(e)
          console.error(`[upload] adset ${adSetId}: ${msg}`)
          errors.push(`שגיאה: ${msg}`)
        }
      }

      if (results.length) {
        await supabase.from('whatsapp_pending').upsert({
          user_id: userId, step: 'await_activation',
          campaigns: JSON.stringify(results), updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      } else {
        // No ads created — reset state instead of leaving a stale await_activation row
        await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      }

      let msg = results.length
        ? `✅ נוצרו ${results.length} מודעות מושהות\n\nקמפיין: ${pending.campaign_name}\nסדרה: ${pending.adset_name}\n\nשלח "מאשר" להפעיל, או "ביטול" להשאיר מושהות.`
        : `⚠️ הקובץ הועלה אבל לא נוצרו מודעות`
      if (errors.length) msg += `\n\nשגיאות:\n${errors.map(e => `• ${e}`).join('\n')}`
      await send(from, msg)
    } catch (e) {
      const msg = e.message ?? String(e)
      console.error(`[upload] TOP ERR ${userId}: ${msg}`)
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, `❌ שגיאה בהעלאה: ${msg}`)
    }
    return
  }

  if (pending.step === 'uploading') {
    await send(from, '⏳ ממתין לסיום ההעלאה...')
    return
  }

  await send(from, '👋 שלח תמונה או סרטון להעלאה ל-Meta Ads')
}
