import { parseAdIntent } from './parse-intent.js'
import {
  getActiveCampaigns, getAdSets,
  uploadImageCreative, uploadVideoCreative,
  buildAndCreateAd, activateAd,
} from './meta-api.js'
import { isBudgetTrigger, isBudgetStep, handleBudgetFlow, startBudgetFlow } from './adigobudget.js'
import { isPerfTrigger, isPerfStep, handlePerfFlow, startPerfFlow } from './adigoperf.js'
import { isAdminTrigger, isAdminStep, handleAdminFlow, startAdminFlow } from './adigoadmin.js'

// ── i18n ─────────────────────────────────────────────────────────────────────
// Locale comes from user_metadata.locale (set to 'he' per-user for Hebrew
// speakers, everyone else gets English). Every user-facing string in this
// module goes through T[locale].
const T = {
  en: {
    no_active_campaigns: '❌ No active campaigns found in this account.',
    load_campaigns_err: (m) => `❌ Failed to load campaigns: ${m}`,
    generic_err: (m) => `❌ Error: ${m}`,
    got_image_matched: (campaign, menu) => `Got the image.\nCampaign: 🟢 ${campaign}\n\nWhich ad set?\n\n${menu}\n\nReply with a number or "cancel"`,
    got_video_matched: (campaign, menu) => `Got the video.\nCampaign: 🟢 ${campaign}\n\nWhich ad set?\n\n${menu}\n\nReply with a number or "cancel"`,
    got_image_pick_campaign: (menu) => `Got the image.\n\n${menu}\n\nWhich campaign? (reply with a number or "cancel")`,
    got_video_pick_campaign: (menu) => `Got the video.\n\n${menu}\n\nWhich campaign? (reply with a number or "cancel")`,
    adset_all_active: 'All active ad sets',
    adset_all_incl: 'All ad sets (including paused)',
    upload_source: (d, t) => `WhatsApp upload | ${d} | ${t}`,
    sub_expired: '❌ Your subscription has expired. Renew at adsend.vercel.app',
    upload_limit: '❌ You’ve hit the 100 uploads/month limit. For additional capacity go to adsend.vercel.app',
    no_meta: '❌ Meta not connected. Head to adsend.vercel.app to link your ad account.',
    no_ad_accounts: '❌ No ad accounts found. Open the app and connect an account.',
    which_account: (menu) => `🗂️ Which ad account?\n\n${menu}\n\nReply with a number or "cancel"`,
    which_account_media: (kind, menu) => `Got the ${kind}.\n\n🗂️ Which ad account?\n\n${menu}\n\nReply with a number or "cancel"`,
    cancelled: '↩️ Cancelled.',
    ads_activated: (n) => `✅ ${n} ad${n === 1 ? '' : 's'} activated!`,
    ads_activate_fail: '⚠️ Failed to activate.',
    errors_prefix: 'Errors:',
    yes_words: ['yes', 'confirm', 'y', 'ok', '✅'],
    cancel_words: ['cancel', 'stop', 'abort'],
    account_pick_err: (menu) => `❓ Didn’t catch that. Pick an ad account (send a number):\n\n${menu}\n\nOr "cancel"`,
    campaign_pick_err: (max, menu) => `❓ Didn’t catch that. Send a number between 1 and ${max}:\n\n${menu}`,
    adset_choose_err: (max, menu) => `❓ Didn’t catch that. Send a number between 1 and ${max}:\n\n${menu}`,
    adset_none: '⚠️ No ad sets in this selection. Try again.',
    campaign_line: (name, menu) => `Campaign: 🟢 ${name}\n\nWhich ad set?\n\n${menu}\n\nReply with a number or "cancel"`,
    adset_line: (label) => `Ad set: ${label}\n\nAny extras? (alternate link, text)\nIf none — reply "no"`,
    extra_no_words: ['no', 'none', 'skip', 'nope'],
    summary_lead: '🎯 Summary:',
    summary_campaign: '📁 Campaign:',
    summary_adset: '📂 Ad set:',
    summary_kind: '📎 Kind:',
    summary_kind_image: 'image',
    summary_kind_video: 'video',
    summary_link: '🔗 Link:',
    summary_copy: '📝 Copy:',
    confirm_q: '\n\nConfirm? (yes / cancel)',
    uploading: '⏳ Uploading...',
    upload_created: (n, campaign, adset) => `✅ ${n} paused ad${n === 1 ? '' : 's'} created\n\nCampaign: ${campaign}\nAd set: ${adset}\n\nReply "confirm" to activate them, or "cancel" to leave them paused.`,
    upload_none: '⚠️ File uploaded but no ads were created',
    upload_err: (m) => `❌ Upload error: ${m}`,
    upload_ad_err: (m) => `Error: ${m}`,
    uploading_wait: '⏳ Waiting for upload to finish...',
    greeting: '👋 Send an image or video to push it to Meta Ads',
  },
  he: {
    no_active_campaigns: '❌ לא נמצאו קמפיינים פעילים בחשבון.',
    load_campaigns_err: (m) => `❌ שגיאה בטעינת קמפיינים: ${m}`,
    generic_err: (m) => `❌ שגיאה: ${m}`,
    got_image_matched: (campaign, menu) => `קיבלתי תמונה.\nקמפיין: 🟢 ${campaign}\n\nלאיזה סדרת מודעות?\n\n${menu}\n\nשלח מספר או "ביטול"`,
    got_video_matched: (campaign, menu) => `קיבלתי סרטון.\nקמפיין: 🟢 ${campaign}\n\nלאיזה סדרת מודעות?\n\n${menu}\n\nשלח מספר או "ביטול"`,
    got_image_pick_campaign: (menu) => `קיבלתי תמונה.\n\n${menu}\n\nלאיזה קמפיין? (שלח מספר או "ביטול")`,
    got_video_pick_campaign: (menu) => `קיבלתי סרטון.\n\n${menu}\n\nלאיזה קמפיין? (שלח מספר או "ביטול")`,
    adset_all_active: 'כל הסדרות הפעילות',
    adset_all_incl: 'כל הסדרות (כולל כבויות)',
    upload_source: (d, t) => `העלאה מווצאפ | ${d} | ${t}`,
    sub_expired: '❌ המנוי שלך פג תוקף. כנס ל-adsend.vercel.app לחידוש.',
    upload_limit: '❌ הגעת למגבלת 100 העלאות החודש. לרכישת מנוי נוסף — כנס לadsend.vercel.app',
    no_meta: '❌ לא מחובר למטא. כנס ל-adsend.vercel.app ותחבר חשבון.',
    no_ad_accounts: '❌ לא נמצאו חשבונות מודעות. כנס לאפליקציה וחבר חשבון.',
    which_account: (menu) => `🗂️ לאיזה חשבון מודעות?\n\n${menu}\n\nשלח מספר או "ביטול"`,
    which_account_media: (kind, menu) => `קיבלתי ${kind}.\n\n🗂️ לאיזה חשבון מודעות?\n\n${menu}\n\nשלח מספר או "ביטול"`,
    cancelled: '↩️ בוטל.',
    ads_activated: (n) => `✅ ${n} מודעות הופעלו!`,
    ads_activate_fail: '⚠️ לא הצלחתי להפעיל.',
    errors_prefix: 'שגיאות:',
    yes_words: ['מאשר', 'כן', 'yes', '✅'],
    cancel_words: ['ביטול', 'cancel'],
    account_pick_err: (menu) => `❓ לא הבנתי. בחר חשבון מודעות (שלח מספר):\n\n${menu}\n\nאו "ביטול"`,
    campaign_pick_err: (max, menu) => `❓ לא הבנתי. שלח מספר בין 1 ל-${max}:\n\n${menu}`,
    adset_choose_err: (max, menu) => `❓ לא הבנתי. שלח מספר בין 1 ל-${max}:\n\n${menu}`,
    adset_none: '⚠️ לא נמצאו סדרות בבחירה זו. נסה שוב.',
    campaign_line: (name, menu) => `קמפיין: 🟢 ${name}\n\nלאיזה סדרת מודעות?\n\n${menu}\n\nשלח מספר או "ביטול"`,
    adset_line: (label) => `סדרה: ${label}\n\nיש הערות? (לינק אחר, טקסט)\nאם לא — שלח "לא"`,
    extra_no_words: ['לא', 'no'],
    summary_lead: '🎯 סיכום:',
    summary_campaign: '📁 קמפיין:',
    summary_adset: '📂 סדרה:',
    summary_kind: '📎 סוג:',
    summary_kind_image: 'תמונה',
    summary_kind_video: 'סרטון',
    summary_link: '🔗 לינק:',
    summary_copy: '📝 טקסט:',
    confirm_q: '\n\nמאשר? (כן / ביטול)',
    uploading: '⏳ מעלה...',
    upload_created: (n, campaign, adset) => `✅ נוצרו ${n} מודעות מושהות\n\nקמפיין: ${campaign}\nסדרה: ${adset}\n\nשלח "מאשר" להפעיל, או "ביטול" להשאיר מושהות.`,
    upload_none: '⚠️ הקובץ הועלה אבל לא נוצרו מודעות',
    upload_err: (m) => `❌ שגיאה בהעלאה: ${m}`,
    upload_ad_err: (m) => `שגיאה: ${m}`,
    uploading_wait: '⏳ ממתין לסיום ההעלאה...',
    greeting: '👋 שלח תמונה או סרטון להעלאה ל-Meta Ads',
  },
}

function pickLocale(user) {
  const raw = user?.user_metadata?.locale
  return raw === 'he' ? 'he' : 'en'
}

function buildCampaignMenu(campaigns) {
  return campaigns.map((c, i) => `${i + 1}. 🟢 ${c.name}`).join('\n')
}

function buildAccountMenu(accounts) {
  return accounts.map((a, i) => `${i + 1}. ${a.account_name}`).join('\n')
}

function buildAdSetMenu(adsets, t) {
  const lines = adsets.map((a, i) => `${i + 1}. ${a.status === 'ACTIVE' ? '🟢' : '⚫'} ${a.name}`)
  lines.push(`${adsets.length + 1}. ${t.adset_all_active}`)
  lines.push(`${adsets.length + 2}. ${t.adset_all_incl}`)
  return lines.join('\n')
}

function assetName(t) {
  const now = new Date()
  const d = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
  const time = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit', hour12: false })
  return t.upload_source(d, time)
}

function normPhone(s) {
  return (s ?? '').split(':')[0].split('@')[0].replace(/\D/g, '').replace(/^0+/, '')
}

function canonPhone(s) {
  const n = normPhone(s)
  return n.length >= 9 ? n.slice(-9) : n
}

async function startUploadFlow({ supabase, send, from, userId, token, adAccount, mediaBuffer, mediaType, caption, t }) {
  const captionText = (caption ?? '').trim()
  let campaigns
  try {
    campaigns = await getActiveCampaigns(adAccount.account_id, token)
    if (!campaigns.length) {
      await send(from, t.no_active_campaigns)
      return
    }
  } catch (e) {
    await send(from, t.load_campaigns_err(e.message.slice(0, 80)))
    return
  }

  const intent = await parseAdIntent(captionText, campaigns.map(c => ({ id: c.id, name: c.name, adsets: [] })))
  const matchedCampaign = intent.campaign_hint
    ? campaigns.find(c => c.name.toLowerCase().includes(intent.campaign_hint.toLowerCase()))
    : null

  if (matchedCampaign) {
    let adsets
    try { adsets = await getAdSets(matchedCampaign.id, token) }
    catch (e) { await send(from, t.generic_err(e.message.slice(0, 80))); return }

    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, media_base64: mediaBuffer, media_type: mediaType,
      step: 'await_adset', intent: 'upload', campaigns: JSON.stringify(campaigns),
      campaign_id: matchedCampaign.id, campaign_name: matchedCampaign.name,
      adsets: JSON.stringify(adsets), account_id: adAccount.account_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const buildFn = mediaType === 'image' ? t.got_image_matched : t.got_video_matched
    await send(from, buildFn(matchedCampaign.name, buildAdSetMenu(adsets, t)))
  } else {
    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, media_base64: mediaBuffer, media_type: mediaType,
      step: 'await_campaign', intent: 'upload', campaigns: JSON.stringify(campaigns),
      account_id: adAccount.account_id, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const buildFn = mediaType === 'image' ? t.got_image_pick_campaign : t.got_video_pick_campaign
    await send(from, buildFn(buildCampaignMenu(campaigns)))
  }
}

export async function handleFlow({ supabase, send, body }) {
  const { userId, from, ownPhone, messageType, text, mediaBuffer, mediaType } = body

  const [
    { data: allowedNumbers },
    { data: sub },
    { data: metaConn },
    { data: adAccounts },
    { data: pending },
    { data: userInfo },
  ] = await Promise.all([
    supabase.from('whatsapp_allowed_numbers').select('phone_number').eq('user_id', userId),
    supabase.from('subscriptions').select('status, current_period_end, tier').eq('user_id', userId).maybeSingle(),
    supabase.from('meta_connections').select('access_token').eq('user_id', userId).maybeSingle(),
    supabase.from('ad_accounts').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('whatsapp_pending').select('*').eq('user_id', userId).maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ])

  const locale = pickLocale(userInfo?.user)
  const t = T[locale]

  {
    const fromC = canonPhone(from)
    const ownC = canonPhone(ownPhone)
    const allowed = (allowedNumbers ?? [])
      .map(n => canonPhone(n.phone_number))
      .filter(p => p.length >= 7)
    const isOwner = ownC.length >= 7 && fromC === ownC
    const isAllowed = fromC.length >= 7 && (isOwner || allowed.includes(fromC))
    if (!isAllowed) return
  }

  if (messageType === 'image' || messageType === 'video') {
    if (sub?.status === 'expired') {
      await send(from, t.sub_expired)
      return
    }
    const isCancelledExpired = sub?.status === 'cancelled' && sub.current_period_end && new Date(sub.current_period_end) < new Date()
    if (isCancelledExpired) {
      await send(from, t.sub_expired)
      return
    }
    if (sub && ['active', 'trial', 'cancelled'].includes(sub.status)) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count } = await supabase.from('uploads').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', monthStart)
      if ((count ?? 0) >= 100) {
        await send(from, t.upload_limit)
        return
      }
    }
  }

  if (!metaConn) {
    await send(from, t.no_meta)
    return
  }
  if (!adAccounts?.length) {
    await send(from, t.no_ad_accounts)
    return
  }

  const token = metaConn.access_token
  const msg = (text ?? '').trim()
  const msgLower = msg.toLowerCase()

  const isAgency = sub?.tier === 'agency'
  const needAccountChoice = isAgency && adAccounts.length > 1
  const adAccount =
    adAccounts.find(a => a.account_id === pending?.account_id) ?? adAccounts[0]

  const askForAccount = async (queuedIntent, extra = {}) => {
    await supabase.from('whatsapp_pending').upsert({
      user_id: userId, step: 'await_account', intent: queuedIntent,
      ...extra, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    await send(from, t.which_account(buildAccountMenu(adAccounts)))
  }

  // ── ACTIVATE ───────────────────────────────────────────────────────────────
  if (pending?.step === 'await_activation' && t.yes_words.includes(msgLower)) {
    const adIds = JSON.parse(pending.campaigns ?? '[]')
    const results = []
    const errors = []
    for (const adId of adIds) {
      try { await activateAd(adId, token); results.push(adId) }
      catch (e) { errors.push(e.message.slice(0, 80)) }
    }
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    let out = results.length ? t.ads_activated(results.length) : t.ads_activate_fail
    if (errors.length) out += `\n\n${t.errors_prefix}\n${errors.map(e => `• ${e}`).join('\n')}`
    await send(from, out)
    return
  }

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  if (pending && t.cancel_words.includes(msgLower)) {
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    await send(from, t.cancelled)
    return
  }

  // ── AGENCY: ACCOUNT SELECTION GATE ───────────────────────────────────────────
  if (pending?.step === 'await_account') {
    const idx = parseInt(msg) - 1
    const chosen = (!isNaN(idx) && idx >= 0 && idx < adAccounts.length)
      ? adAccounts[idx]
      : adAccounts.find(a => a.account_name.toLowerCase().includes(msgLower))
    if (!chosen) {
      await send(from, t.account_pick_err(buildAccountMenu(adAccounts)))
      return
    }
    const queued = pending.intent
    if (queued === 'budget') {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await startBudgetFlow({ supabase, send, from, userId, token, adAccount: chosen, locale })
      return
    }
    if (queued === 'perf') {
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await startPerfFlow({ supabase, send, from, userId, token, adAccount: chosen, locale })
      return
    }
    await startUploadFlow({
      supabase, send, from, userId, token, adAccount: chosen,
      mediaBuffer: pending.media_base64, mediaType: pending.media_type,
      caption: pending.primary_text ?? '', t,
    })
    return
  }

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  if (isAdminTrigger(userId, msg)) {
    await startAdminFlow({ supabase, send, from, userId })
    return
  }
  if (isAdminStep(pending?.step)) {
    await handleAdminFlow({ supabase, send, from, userId, token, t: msg, pending })
    return
  }

  // ── BUDGET SKILL ─────────────────────────────────────────────────────────────
  if (isBudgetTrigger(msg)) {
    if (needAccountChoice) { await askForAccount('budget'); return }
    await handleBudgetFlow({ supabase, send, from, userId, token, adAccount, t: msg, pending, locale })
    return
  }
  if (isBudgetStep(pending?.step)) {
    await handleBudgetFlow({ supabase, send, from, userId, token, adAccount, t: msg, pending, locale })
    return
  }

  // ── PERFORMANCE SKILL ────────────────────────────────────────────────────────
  if (isPerfTrigger(msg)) {
    if (needAccountChoice) { await askForAccount('perf'); return }
    await handlePerfFlow({ supabase, send, from, userId, token, adAccount, t: msg, pending, locale })
    return
  }
  if (isPerfStep(pending?.step)) {
    await handlePerfFlow({ supabase, send, from, userId, token, adAccount, t: msg, pending, locale })
    return
  }

  // ── NEW MEDIA ──────────────────────────────────────────────────────────────
  if (messageType === 'image' || messageType === 'video') {
    if (needAccountChoice) {
      const kind = mediaType === 'image' ? t.summary_kind_image : t.summary_kind_video
      await supabase.from('whatsapp_pending').upsert({
        user_id: userId, step: 'await_account', intent: 'upload',
        media_base64: mediaBuffer, media_type: mediaType,
        primary_text: msg || null, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      await send(from, t.which_account_media(kind, buildAccountMenu(adAccounts)))
      return
    }
    await startUploadFlow({ supabase, send, from, userId, token, adAccount, mediaBuffer, mediaType, caption: msg, t })
    return
  }

  // ── FLOW STEPS ─────────────────────────────────────────────────────────────
  if (!pending) {
    await send(from, t.greeting)
    return
  }

  if (pending.step === 'await_campaign') {
    const campaigns = JSON.parse(pending.campaigns ?? '[]')
    const idx = parseInt(msg) - 1
    const chosen = (!isNaN(idx) && idx >= 0 && idx < campaigns.length)
      ? campaigns[idx]
      : campaigns.find(c => c.name.toLowerCase().includes(msgLower))
    if (!chosen) {
      await send(from, t.campaign_pick_err(campaigns.length, buildCampaignMenu(campaigns)))
      return
    }
    let adsets
    try { adsets = await getAdSets(chosen.id, token) }
    catch (e) { await send(from, t.generic_err(e.message.slice(0, 80))); return }
    await supabase.from('whatsapp_pending').update({
      step: 'await_adset', campaign_id: chosen.id, campaign_name: chosen.name, adsets: JSON.stringify(adsets),
    }).eq('user_id', userId)
    await send(from, t.campaign_line(chosen.name, buildAdSetMenu(adsets, t)))
    return
  }

  if (pending.step === 'await_adset') {
    const adsets = JSON.parse(pending.adsets ?? '[]')
    const allActiveIdx = adsets.length + 1
    const allIdx = adsets.length + 2
    const num = parseInt(msg)
    let selectedIds, label

    if (num === allActiveIdx) {
      selectedIds = adsets.filter(a => a.status === 'ACTIVE').map(a => a.id)
      label = t.adset_all_active
    } else if (num === allIdx) {
      selectedIds = adsets.map(a => a.id)
      label = t.adset_all_incl
    } else if (!isNaN(num) && num >= 1 && num <= adsets.length) {
      selectedIds = [adsets[num - 1].id]
      label = adsets[num - 1].name
    } else {
      const found = adsets.find(a => a.name.toLowerCase().includes(msgLower))
      if (!found) {
        await send(from, t.adset_choose_err(allIdx, buildAdSetMenu(adsets, t)))
        return
      }
      selectedIds = [found.id]
      label = found.name
    }

    if (!selectedIds.length) {
      await send(from, t.adset_none)
      return
    }

    await supabase.from('whatsapp_pending').update({
      step: 'await_extra', adset_id: selectedIds.join(','), adset_name: label,
    }).eq('user_id', userId)
    await send(from, t.adset_line(label))
    return
  }

  if (pending.step === 'await_extra') {
    const extra = t.extra_no_words.includes(msgLower) ? '' : msg
    const urlMatch = extra.match(/https?:\/\/\S+/)
    const overrideUrl = urlMatch ? urlMatch[0] : null
    const overrideCopy = extra ? (extra.replace(/https?:\/\/\S+/g, '').trim() || null) : null
    const kind = pending.media_type === 'image' ? t.summary_kind_image : t.summary_kind_video

    let confirmMsg = `${t.summary_lead}\n${t.summary_campaign} ${pending.campaign_name}\n${t.summary_adset} ${pending.adset_name}\n${t.summary_kind} ${kind}`
    if (overrideUrl) confirmMsg += `\n${t.summary_link} ${overrideUrl}`
    if (overrideCopy) confirmMsg += `\n${t.summary_copy} ${overrideCopy}`
    confirmMsg += t.confirm_q

    await supabase.from('whatsapp_pending').update({
      step: 'await_confirmation', primary_text: overrideCopy, destination_url: overrideUrl,
    }).eq('user_id', userId)
    await send(from, confirmMsg)
    return
  }

  if (pending.step === 'await_confirmation' && t.yes_words.includes(msgLower)) {
    await supabase.from('whatsapp_pending').update({ step: 'uploading' }).eq('user_id', userId)
    await send(from, t.uploading)

    const selectedIds = (pending.adset_id ?? '').split(',').filter(Boolean)
    const name = assetName(t)

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
          const m = e.message ?? String(e)
          console.error(`[upload] adset ${adSetId}: ${m}`)
          errors.push(t.upload_ad_err(m))
        }
      }

      if (results.length) {
        await supabase.from('whatsapp_pending').upsert({
          user_id: userId, step: 'await_activation',
          campaigns: JSON.stringify(results), updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      } else {
        await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      }

      let out = results.length
        ? t.upload_created(results.length, pending.campaign_name, pending.adset_name)
        : t.upload_none
      if (errors.length) out += `\n\n${t.errors_prefix}\n${errors.map(e => `• ${e}`).join('\n')}`
      await send(from, out)
    } catch (e) {
      const m = e.message ?? String(e)
      console.error(`[upload] TOP ERR ${userId}: ${m}`)
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(from, t.upload_err(m))
    }
    return
  }

  if (pending.step === 'uploading') {
    await send(from, t.uploading_wait)
    return
  }

  await send(from, t.greeting)
}
