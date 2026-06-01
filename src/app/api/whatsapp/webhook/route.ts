import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { parseAdIntent } from '@/lib/ai/parse-intent'
import { getActiveCampaigns, getAdSets, uploadImageCreative, uploadVideoCreative, createAd } from '@/lib/meta/api'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BAILEYS_SERVER = process.env.BAILEYS_SERVER_URL ?? 'http://localhost:3001'

// Validates webhook signature from Baileys server
function validateSecret(request: Request): boolean {
  const secret = request.headers.get('x-webhook-secret')
  return secret === process.env.WHATSAPP_WEBHOOK_SECRET
}

async function sendMessage(userId: string, phone: string, text: string) {
  await fetch(`${BAILEYS_SERVER}/session/${userId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: phone, text }),
  })
}

export async function POST(request: Request) {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, from, messageType, text, mediaBuffer, mediaType } = body

  // Get user's Meta token
  const { data: metaConn } = await supabase
    .from('meta_connections')
    .select('access_token')
    .eq('user_id', userId)
    .single()

  if (!metaConn) {
    await sendMessage(userId, from, '❌ לא מחובר למטא. כנס ל-app.adsend.co ותחבר חשבון.')
    return NextResponse.json({ ok: true })
  }

  const { data: adAccounts } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!adAccounts?.length) {
    await sendMessage(userId, from, '❌ לא נמצאו חשבונות מודעות פעילים. כנס לאפליקציה וחבר.')
    return NextResponse.json({ ok: true })
  }

  const adAccount = adAccounts[0]
  const token = metaConn.access_token

  // Get pending state for this user (multi-step conversation)
  const { data: pendingState } = await supabase
    .from('whatsapp_pending')
    .select('*')
    .eq('user_id', userId)
    .single()

  // --- CONFIRMATION STEP ---
  if (pendingState && (text === 'כן' || text === 'yes' || text === '✅')) {
    const p = pendingState
    try {
      await sendMessage(userId, from, '⏳ מעלה...')

      let mediaId: string | undefined
      if (p.media_type === 'image') {
        mediaId = await uploadImageCreative(adAccount.account_id, Buffer.from(p.media_base64, 'base64'), token)
      } else {
        mediaId = await uploadVideoCreative(adAccount.account_id, Buffer.from(p.media_base64, 'base64'), token)
      }

      const adName = `AdSend | ${new Date().toLocaleDateString('he-IL')} | ${p.adset_name}`
      const adId = await createAd({
        adAccountId: adAccount.account_id,
        adsetId: p.adset_id,
        name: adName,
        imageHash: p.media_type === 'image' ? mediaId : undefined,
        videoId: p.media_type === 'video' ? mediaId : undefined,
        primaryText: p.primary_text,
        headline: p.headline,
        cta: p.cta,
        destinationUrl: p.destination_url,
        utm: p.utm,
        status: p.status,
        accessToken: token,
      })

      await supabase.from('uploads').insert({
        user_id: userId,
        ad_account_id: adAccount.id,
        campaign_id: p.campaign_id,
        campaign_name: p.campaign_name,
        adset_id: p.adset_id,
        adset_name: p.adset_name,
        meta_ad_id: adId,
        media_type: p.media_type,
        primary_text: p.primary_text,
        headline: p.headline,
        cta: p.cta,
        destination_url: p.destination_url,
        utm: p.utm,
        status: p.status,
      })

      await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
      await sendMessage(userId, from, `✅ הועלה!\nמודעה: ${adName}\nסטטוס: ${p.status}\nhttps://www.facebook.com/adsmanager/manage/ads`)
    } catch (err) {
      await sendMessage(userId, from, `❌ שגיאה בהעלאה: ${(err as Error).message}`)
    }
    return NextResponse.json({ ok: true })
  }

  // --- CANCEL ---
  if (pendingState && (text === 'לא' || text === 'no' || text === '❌')) {
    await supabase.from('whatsapp_pending').delete().eq('user_id', userId)
    await sendMessage(userId, from, '↩️ בוטל. שלח קריאייטיב חדש כשתרצה.')
    return NextResponse.json({ ok: true })
  }

  // --- NEW CREATIVE ---
  if (messageType === 'image' || messageType === 'video') {
    const campaigns = await getActiveCampaigns(adAccount.account_id, token)

    const campaignsWithAdsets = await Promise.all(
      campaigns.map(async c => ({
        id: c.id,
        name: c.name,
        adsets: await getAdSets(c.id, token),
      }))
    )

    const intent = await parseAdIntent(text ?? '', campaignsWithAdsets)

    // Match campaign
    const matchedCampaign = intent.campaign_hint
      ? campaignsWithAdsets.find(c => c.name.toLowerCase().includes(intent.campaign_hint!.toLowerCase()))
      : null

    // Match adset
    const matchedAdset = matchedCampaign && intent.adset_hint
      ? matchedCampaign.adsets.find(a => a.name.toLowerCase().includes(intent.adset_hint!.toLowerCase()))
      : null

    if (!matchedCampaign) {
      const list = campaignsWithAdsets.map((c, i) => `${i + 1}. ${c.name}`).join('\n')
      await supabase.from('whatsapp_pending').upsert({
        user_id: userId,
        media_base64: mediaBuffer,
        media_type: mediaType,
        intent: JSON.stringify(intent),
        step: 'awaiting_campaign',
        campaigns: JSON.stringify(campaignsWithAdsets),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      await sendMessage(userId, from, `📁 לאיזה קמפיין?\n${list}`)
      return NextResponse.json({ ok: true })
    }

    if (!matchedAdset) {
      const list = matchedCampaign.adsets.map((a, i) => `${i + 1}. ${a.name}`).join('\n')
      await supabase.from('whatsapp_pending').upsert({
        user_id: userId,
        media_base64: mediaBuffer,
        media_type: mediaType,
        intent: JSON.stringify(intent),
        campaign_id: matchedCampaign.id,
        campaign_name: matchedCampaign.name,
        step: 'awaiting_adset',
        adsets: JSON.stringify(matchedCampaign.adsets),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      await sendMessage(userId, from, `📂 איזו סדרה בקמפיין "${matchedCampaign.name}"?\n${list}`)
      return NextResponse.json({ ok: true })
    }

    // Got everything — confirm
    const confirmMsg = `🎯 הבנתי:\n📁 קמפיין: *${matchedCampaign.name}*\n📂 סדרה: *${matchedAdset.name}*${intent.primary_text ? `\n📝 טקסט: "${intent.primary_text}"` : ''}${intent.utm ? `\n🔗 UTM: ${intent.utm}` : ''}\n📌 סטטוס: ${intent.status === 'ACTIVE' ? '🟢 ACTIVE' : '⏸ PAUSED'}\n\nמאשר? (כן/לא)`

    await supabase.from('whatsapp_pending').upsert({
      user_id: userId,
      media_base64: mediaBuffer,
      media_type: mediaType,
      campaign_id: matchedCampaign.id,
      campaign_name: matchedCampaign.name,
      adset_id: matchedAdset.id,
      adset_name: matchedAdset.name,
      primary_text: intent.primary_text,
      headline: intent.headline,
      cta: intent.cta,
      destination_url: intent.destination_url,
      utm: intent.utm,
      status: intent.status,
      step: 'awaiting_confirmation',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    await sendMessage(userId, from, confirmMsg)
    return NextResponse.json({ ok: true })
  }

  // --- TEXT REPLY (campaign/adset selection) ---
  if (pendingState?.step === 'awaiting_campaign') {
    const campaigns = JSON.parse(pendingState.campaigns) as { id: string; name: string; adsets: { id: string; name: string }[] }[]
    const idx = parseInt(text ?? '') - 1
    const chosen = isNaN(idx) ? campaigns.find(c => c.name.toLowerCase().includes((text ?? '').toLowerCase())) : campaigns[idx]
    if (!chosen) {
      await sendMessage(userId, from, `❓ לא הבנתי. שלח מספר מהרשימה:\n${campaigns.map((c, i) => `${i + 1}. ${c.name}`).join('\n')}`)
      return NextResponse.json({ ok: true })
    }
    const list = chosen.adsets.map((a, i) => `${i + 1}. ${a.name}`).join('\n')
    await supabase.from('whatsapp_pending').update({
      campaign_id: chosen.id,
      campaign_name: chosen.name,
      step: 'awaiting_adset',
      adsets: JSON.stringify(chosen.adsets),
    }).eq('user_id', userId)
    await sendMessage(userId, from, `📂 איזו סדרה בקמפיין "${chosen.name}"?\n${list}`)
    return NextResponse.json({ ok: true })
  }

  if (pendingState?.step === 'awaiting_adset') {
    const adsets = JSON.parse(pendingState.adsets) as { id: string; name: string }[]
    const idx = parseInt(text ?? '') - 1
    const chosen = isNaN(idx) ? adsets.find(a => a.name.toLowerCase().includes((text ?? '').toLowerCase())) : adsets[idx]
    if (!chosen) {
      await sendMessage(userId, from, `❓ לא הבנתי. שלח מספר מהרשימה:\n${adsets.map((a, i) => `${i + 1}. ${a.name}`).join('\n')}`)
      return NextResponse.json({ ok: true })
    }
    const intent = JSON.parse(pendingState.intent ?? '{}') as { primary_text?: string; utm?: string; status?: string }
    const confirmMsg = `🎯 הבנתי:\n📁 קמפיין: *${pendingState.campaign_name}*\n📂 סדרה: *${chosen.name}*${intent.primary_text ? `\n📝 טקסט: "${intent.primary_text}"` : ''}\n📌 סטטוס: ${intent.status === 'ACTIVE' ? '🟢 ACTIVE' : '⏸ PAUSED'}\n\nמאשר? (כן/לא)`
    await supabase.from('whatsapp_pending').update({
      adset_id: chosen.id,
      adset_name: chosen.name,
      step: 'awaiting_confirmation',
    }).eq('user_id', userId)
    await sendMessage(userId, from, confirmMsg)
    return NextResponse.json({ ok: true })
  }

  await sendMessage(userId, from, '👋 שלח תמונה או סרטון להעלאה ל-Meta Ads')
  return NextResponse.json({ ok: true })
}
