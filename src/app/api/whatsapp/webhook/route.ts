import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { parseAdIntent } from '@/lib/ai/parse-intent'
import {
  getActiveCampaigns, getAdSets,
  uploadImageCreative, uploadVideoCreative,
  buildAndCreateAd, activateAd
} from '@/lib/meta/api'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const BAILEYS_SERVER = process.env.BAILEYS_SERVER_URL ?? 'http://localhost:3001'

function validateSecret(request: Request): boolean {
  return request.headers.get('x-webhook-secret') === process.env.WHATSAPP_WEBHOOK_SECRET
}

async function send(userId: string, phone: string, text: string) {
  await fetch(`${BAILEYS_SERVER}/session/${userId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: phone, text }),
  }).catch(() => {})
}

function buildCampaignMenu(campaigns: { id: string; name: string }[]) {
  return campaigns.map((c, i) => `${i + 1}. 🟢 ${c.name}`).join('\n')
}

function buildAdSetMenu(adsets: { id: string; name: string; status: string }[]) {
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

export async function POST(request: Request) {
  if (!validateSecret(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getSupabase()
  const body = await request.json()
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
    supabase.from('subscriptions').select('status, current_period_end').eq('user_id', userId).maybeSingle(),
    supabase.from('meta_connections').select('access_token').eq('user_id', userId).maybeSingle(),
    supabase.from('ad_accounts').select('*').eq('user_id', userId).eq('is_active', true),
    supabase.from('whatsapp_pending').select('*').eq('user_id', userId).maybeSingle(),
  ])

  // ── WHITELIST CHECK ────────────────────────────────────────────────────────
  if (allowedNumbers && allowedNumbers.length > 0) {
    const norm = (s: string) => s.split(':')[0].split('@')[0].replace(/\D/g, '').replace(/^0+/, '')
    const fromNorm = norm(from as string)
    const isAllowed = allowedNumbers.some(n => {
      const stored = norm(n.phone_number)
      return fromNorm.endsWith(stored) || stored.endsWith(fromNorm)
    })
    if (!isAllowed) return NextResponse.json({ ok: true })
  }

  // ── UPLOAD LIMIT CHECK ─────────────────────────────────────────────────────
  if (messageType === 'image' || messageType === 'video') {
    if (sub?.status === 'expired') {
      await send(userId, from, '❌ המנוי שלך פג תוקף. כנס ל-adsend.vercel.app לחידוש.')
      return NextResponse.json({ ok: true })
    }
    const isCancelledExpired = sub?.status === 'cancelled' && sub.current_period_end && new Date(sub.current_period_end) < new Date()
    if (isCancelledExpired) {
      await send(userId, from, '❌ המנוי שלך פג תוקף. כנס ל-adsend.vercel.app לחידוש.')
      return NextResponse.json({ ok: true })
    }
    if (sub && (sub.status === 'active' || sub.status === 'trial' || sub.status === 'cancelled')) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { count } = await supabase.from('uploads').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', monthStart)
      if ((count ?? 0) >= 100) {
        await send(userId, from, '❌ הגעת למגבלת 100 העלאות החודש. לרכישת מנוי נוסף — כנס לadsend.vercel.app')
        return NextResponse.json({ ok: true })
      }
    }
  }

  if (!metaConn) {
    await send(userId, from, '❌ לא מחובר למטא. כנס ל-adsend.vercel.app ותחבר חשבון.')
    return NextResponse.json({ ok: true })
  }

  if (!adAccounts?.length) {
    await send(userId, from, '❌ לא נמצאו חשבונות מודעות. כנס לאפליקציה וחבר חשבון.')
    return NextResponse.json({ ok: true })
  }

  const adAccount = adAccounts[0]
  const token = metaConn.access_token
  const t = (text ?? '').trim()

  // ── ACTIVATE ───────────────────────────────────────────────────────────────
  if (pending?.step === 'await_activation' && (t === 'מאשר' || t === 'כן' || t === 'yes')) {
    const adIds: string[] = JSON.parse(pending.campaigns ?? '[]')
    const results: string[] = []
    const errors: string[] = []
    for (const adId of adIds) {
      try { await activateAd(adId, token); results.push(adId) }
      catch (e) { errors.push((e as Error).message.slice(0, 80)) }
    }
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    let msg = results.length ? `✅ ${results.length} מודעות הופעלו!` : '⚠️ לא הצלחתי להפעיל.'
    if (errors.length) msg += `\n\nשגיאות:\n${errors.map(e => `• ${e}`).join('\n')}`
    await send(userId, from, msg)
    return NextResponse.json({ ok: true })
  }

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  if (pending && (t === 'ביטול' || t.toLowerCase() === 'cancel')) {
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    await send(userId, from, '↩️ בוטל.')
    return NextResponse.json({ ok: true })
  }

  // ── NEW MEDIA ──────────────────────────────────────────────────────────────
  if (messageType === 'image' || messageType === 'video') {
    let campaigns
    try {
      campaigns = await getActiveCampaigns(adAccount.account_id, token)
      if (!campaigns.length) {
        await send(userId, from, '❌ לא נמצאו קמפיינים פעילים בחשבון.')
        return NextResponse.json({ ok: true })
      }
    } catch (e) {
      await send(userId, from, `❌ שגיאה בטעינת קמפיינים: ${(e as Error).message.slice(0, 80)}`)
      return NextResponse.json({ ok: true })
    }

    const intent = await parseAdIntent(t, campaigns.map(c => ({ id: c.id, name: c.name, adsets: [] })))
    const matchedCampaign = intent.campaign_hint
      ? campaigns.find(c => c.name.toLowerCase().includes(intent.campaign_hint!.toLowerCase()))
      : null

    if (matchedCampaign) {
      let adsets
      try { adsets = await getAdSets(matchedCampaign.id, token) }
      catch (e) { await send(userId, from, `❌ שגיאה: ${(e as Error).message.slice(0, 80)}`); return NextResponse.json({ ok: true }) }

      await supabase.from('whatsapp_pending').upsert({
        user_id: userId, media_base64: mediaBuffer, media_type: mediaType,
        step: 'await_adset', campaigns: JSON.stringify(campaigns),
        campaign_id: matchedCampaign.id, campaign_name: matchedCampaign.name,
        adsets: JSON.stringify(adsets), updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      const type = mediaType === 'image' ? 'תמונה' : 'סרטון'
      await send(userId, from, `קיבלתי ${type}.\nקמפיין: 🟢 ${matchedCampaign.name}\n\nלאיזה סדרת מודעות?\n\n${buildAdSetMenu(adsets)}\n\nשלח מספר או "ביטול"`)
    } else {
      await supabase.from('whatsapp_pending').upsert({
        user_id: userId, media_base64: mediaBuffer, media_type: mediaType,
        step: 'await_campaign', campaigns: JSON.stringify(campaigns),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      const type = mediaType === 'image' ? 'תמונה' : 'סרטון'
      await send(userId, from, `קיבלתי ${type}.\n\n${buildCampaignMenu(campaigns)}\n\nלאיזה קמפיין? (שלח מספר או "ביטול")`)
    }
    return NextResponse.json({ ok: true })
  }

  // ── FLOW STEPS ─────────────────────────────────────────────────────────────
  if (!pending) {
    await send(userId, from, '👋 שלח תמונה או סרטון להעלאה ל-Meta Ads')
    return NextResponse.json({ ok: true })
  }

  // campaign selection
  if (pending.step === 'await_campaign') {
    const campaigns: { id: string; name: string }[] = JSON.parse(pending.campaigns ?? '[]')
    const idx = parseInt(t) - 1
    const chosen = (!isNaN(idx) && idx >= 0 && idx < campaigns.length)
      ? campaigns[idx]
      : campaigns.find(c => c.name.toLowerCase().includes(t.toLowerCase()))
    if (!chosen) {
      await send(userId, from, `❓ לא הבנתי. שלח מספר בין 1 ל-${campaigns.length}:\n\n${buildCampaignMenu(campaigns)}`)
      return NextResponse.json({ ok: true })
    }
    let adsets
    try { adsets = await getAdSets(chosen.id, token) }
    catch (e) { await send(userId, from, `❌ שגיאה: ${(e as Error).message.slice(0, 80)}`); return NextResponse.json({ ok: true }) }
    await supabase.from('whatsapp_pending').update({
      step: 'await_adset', campaign_id: chosen.id, campaign_name: chosen.name, adsets: JSON.stringify(adsets)
    }).eq('user_id', userId)
    await send(userId, from, `קמפיין: 🟢 ${chosen.name}\n\nלאיזה סדרת מודעות?\n\n${buildAdSetMenu(adsets)}\n\nשלח מספר או "ביטול"`)
    return NextResponse.json({ ok: true })
  }

  // adset selection
  if (pending.step === 'await_adset') {
    const adsets: { id: string; name: string; status: string }[] = JSON.parse(pending.adsets ?? '[]')
    const allActiveIdx = adsets.length + 1
    const allIdx = adsets.length + 2
    const num = parseInt(t)
    let selectedIds: string[]
    let label: string

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
        await send(userId, from, `❓ לא הבנתי. שלח מספר בין 1 ל-${allIdx}:\n\n${buildAdSetMenu(adsets)}`)
        return NextResponse.json({ ok: true })
      }
      selectedIds = [found.id]
      label = found.name
    }

    if (!selectedIds.length) {
      await send(userId, from, '⚠️ לא נמצאו סדרות בבחירה זו. נסה שוב.')
      return NextResponse.json({ ok: true })
    }

    await supabase.from('whatsapp_pending').update({
      step: 'await_extra', adset_id: selectedIds.join(','), adset_name: label,
    }).eq('user_id', userId)
    await send(userId, from, `סדרה: ${label}\n\nיש הערות? (לינק אחר, טקסט)\nאם לא — שלח "לא"`)
    return NextResponse.json({ ok: true })
  }

  // extra notes
  if (pending.step === 'await_extra') {
    const extra = (t === 'לא' || t === 'no') ? '' : t
    const urlMatch = extra.match(/https?:\/\/\S+/)
    const overrideUrl = urlMatch ? urlMatch[0] : null
    const overrideCopy = extra ? extra.replace(/https?:\/\/\S+/g, '').trim() || null : null
    const type = pending.media_type === 'image' ? 'תמונה' : 'סרטון'

    let confirmMsg = `🎯 סיכום:\n📁 קמפיין: ${pending.campaign_name}\n📂 סדרה: ${pending.adset_name}\n📎 סוג: ${type}`
    if (overrideUrl) confirmMsg += `\n🔗 לינק: ${overrideUrl}`
    if (overrideCopy) confirmMsg += `\n📝 טקסט: ${overrideCopy}`
    confirmMsg += `\n\nמאשר? (כן / ביטול)`

    await supabase.from('whatsapp_pending').update({
      step: 'await_confirmation',
      primary_text: overrideCopy,
      destination_url: overrideUrl,
    }).eq('user_id', userId)
    await send(userId, from, confirmMsg)
    return NextResponse.json({ ok: true })
  }

  // confirmation → upload
  if (pending.step === 'await_confirmation' && (t === 'כן' || t === 'מאשר' || t === 'yes' || t === '✅')) {
    await supabase.from('whatsapp_pending').update({ step: 'uploading' }).eq('user_id', userId)
    await send(userId, from, '⏳ מעלה...')

    const selectedIds = (pending.adset_id ?? '').split(',').filter(Boolean)
    const name = assetName()

    try {
      let asset: { type: 'image'; hash: string } | { type: 'video'; videoId: string }
      if (pending.media_type === 'image') {
        const hash = await uploadImageCreative(adAccount.account_id, Buffer.from(pending.media_base64, 'base64'), token)
        asset = { type: 'image', hash }
      } else {
        const videoId = await uploadVideoCreative(adAccount.account_id, Buffer.from(pending.media_base64, 'base64'), token)
        asset = { type: 'video', videoId }
      }

      const results: string[] = []
      const errors: string[] = []

      for (const adSetId of selectedIds) {
        try {
          const adId = await buildAndCreateAd(
            adAccount.account_id,
            adSetId,
            name,
            asset,
            { link: pending.destination_url ?? undefined, message: pending.primary_text ?? undefined },
            token,
            pending.campaign_name ?? ''
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
        } catch (e) {
          const msg = (e as Error).message ?? String(e)
          console.error(`[upload] adset ${adSetId}: ${msg}`)
          errors.push(`שגיאה: ${msg}`)
        }
      }

      await supabase.from('whatsapp_pending').upsert({
        user_id: userId, step: 'await_activation',
        campaigns: JSON.stringify(results),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      let msg = results.length
        ? `✅ נוצרו ${results.length} מודעות מושהות\n\nקמפיין: ${pending.campaign_name}\nסדרה: ${pending.adset_name}\n\nשלח "מאשר" להפעיל, או "ביטול" להשאיר מושהות.`
        : `⚠️ הקובץ הועלה אבל לא נוצרו מודעות`
      if (errors.length) msg += `\n\nשגיאות:\n${errors.map(e => `• ${e}`).join('\n')}`
      await send(userId, from, msg)

    } catch (e) {
      const msg = (e as Error).message ?? String(e)
      console.error(`[upload] TOP ERR ${userId}: ${msg}`)
      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await send(userId, from, `❌ שגיאה בהעלאה: ${msg}`)
    }
    return NextResponse.json({ ok: true })
  }

  if (pending.step === 'uploading') {
    await send(userId, from, '⏳ ממתין לסיום ההעלאה...')
    return NextResponse.json({ ok: true })
  }

  await send(userId, from, '👋 שלח תמונה או סרטון להעלאה ל-Meta Ads')
  return NextResponse.json({ ok: true })
}
