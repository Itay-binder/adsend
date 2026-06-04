const META_API = 'https://graph.facebook.com/v22.0'

function normalizeAdAccountId(id: string): string {
  const stripped = id.replace(/^act_/, '')
  return `act_${stripped}`
}

export async function getAdAccounts(accessToken: string) {
  const res = await fetch(
    `${META_API}/me/adaccounts?fields=id,name,currency,account_status&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data as { id: string; name: string; currency: string; account_status: number }[]
}

export async function getActiveCampaigns(adAccountId: string, accessToken: string) {
  const filtering = encodeURIComponent(JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]))
  const res = await fetch(
    `${META_API}/${adAccountId}/campaigns?fields=id,name,status,objective&filtering=${filtering}&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const campaigns = (data.data as { id: string; name: string; status: string; objective: string }[]) ?? []
  return campaigns.filter(c => {
    const n = c.name.toLowerCase()
    return !n.startsWith('instagram post') && !n.startsWith('facebook post') && c.objective !== 'POST_ENGAGEMENT'
  })
}

export async function getAdSets(campaignId: string, accessToken: string) {
  const res = await fetch(
    `${META_API}/${campaignId}/adsets?fields=id,name,status&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const sets = (data.data as { id: string; name: string; status: string }[]) ?? []
  return sets.sort((a, b) => (b.status === 'ACTIVE' ? 1 : 0) - (a.status === 'ACTIVE' ? 1 : 0))
}

export async function getAdSetAds(adSetId: string, accessToken: string) {
  const res = await fetch(
    `${META_API}/${adSetId}/ads?fields=id,name,creative{id,object_story_spec}&limit=5&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return (data.data ?? []) as { id: string; name: string; creative?: { id: string; object_story_spec: Record<string, unknown> } }[]
}

export function swapMediaInSpec(spec: Record<string, unknown>, asset: { type: 'image'; hash: string } | { type: 'video'; videoId: string }): Record<string, unknown> {
  const s = JSON.parse(JSON.stringify(spec))
  if (asset.type === 'image') {
    if (s.link_data) {
      s.link_data.image_hash = asset.hash
      delete s.link_data.video_id
    } else if (s.video_data) {
      // video → image: preserve CTA and link from original video spec
      const vd = s.video_data as Record<string, unknown>
      s.link_data = {
        image_hash: asset.hash,
        message: vd.message,
        link: (vd.call_to_action as Record<string, unknown> | undefined)?.value
          ? ((vd.call_to_action as Record<string, unknown>).value as Record<string, unknown>).link
          : undefined,
        ...(vd.call_to_action ? { call_to_action: vd.call_to_action } : {}),
      }
      delete s.video_data
    }
  } else {
    if (s.video_data) {
      s.video_data.video_id = asset.videoId
    } else if (s.link_data) {
      // image → video: preserve CTA from original link_data spec
      const ld = s.link_data as Record<string, unknown>
      s.video_data = {
        video_id: asset.videoId,
        message: ld.message,
        ...(ld.call_to_action
          ? { call_to_action: ld.call_to_action }
          : ld.link ? { call_to_action: { type: 'LEARN_MORE', value: { link: ld.link } } } : {}),
      }
      delete s.link_data
    }
  }
  return s
}

export function applyUtmToSpec(spec: Record<string, unknown>, campaignName: string, adName: string): Record<string, unknown> {
  const slug = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w֐-׿]/g, '').slice(0, 50)
  const addUtm = (url: string) => {
    try {
      const u = new URL(url)
      u.searchParams.set('utm_source', 'facebook')
      u.searchParams.set('utm_medium', 'paid')
      u.searchParams.set('utm_campaign', slug(campaignName))
      u.searchParams.set('utm_content', slug(adName))
      return u.toString()
    } catch { return url }
  }
  const s = JSON.parse(JSON.stringify(spec))
  if (s.video_data?.call_to_action?.value?.link) s.video_data.call_to_action.value.link = addUtm(s.video_data.call_to_action.value.link)
  if (s.link_data?.link) s.link_data.link = addUtm(s.link_data.link)
  return s
}

export async function createAdFromSpec(adAccountId: string, adSetId: string, name: string, spec: Record<string, unknown>, accessToken: string): Promise<string> {
  const accountId = normalizeAdAccountId(adAccountId)
  console.error(`[createAdFromSpec] spec: ${JSON.stringify(spec)}`)
  const creativeRes = await fetch(`${META_API}/${accountId}/adcreatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, object_story_spec: spec, access_token: accessToken }),
  })
  const creativeData = await creativeRes.json() as { id?: string; error?: { message: string; error_user_msg?: string; error_data?: unknown; error_subcode?: number } }
  if (!creativeRes.ok || creativeData.error) {
    const fullErr = JSON.stringify(creativeData.error)
    console.error(`[createAdFromSpec] error: ${fullErr}`)
    throw new Error(fullErr)
  }

  const adRes = await fetch(`${META_API}/${accountId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, adset_id: adSetId, creative: { creative_id: creativeData.id }, status: 'PAUSED', access_token: accessToken }),
  })
  const adData = await adRes.json() as { id?: string; error?: { message: string; error_user_msg?: string } }
  if (!adRes.ok || adData.error) throw new Error(adData.error?.error_user_msg ?? adData.error?.message ?? `Ad error ${adRes.status}`)
  return adData.id!
}

export async function activateAd(adId: string, accessToken: string): Promise<void> {
  const res = await fetch(`${META_API}/${adId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ACTIVE', access_token: accessToken }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
}

export async function uploadImageCreative(
  adAccountId: string,
  imageBuffer: Buffer,
  accessToken: string
): Promise<string> {
  const accountId = normalizeAdAccountId(adAccountId)
  const base64 = imageBuffer.toString('base64')
  const form = new FormData()
  form.append('bytes', base64)
  form.append('access_token', accessToken)

  const res = await fetch(`${META_API}/${accountId}/adimages`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json() as { images?: Record<string, { hash: string }>; error?: { message: string; error_user_msg?: string } }
  if (!res.ok || data.error) throw new Error(data.error?.error_user_msg ?? data.error?.message ?? `Meta error ${res.status}`)
  const hash = Object.values(data.images ?? {})[0]?.hash
  if (!hash) throw new Error('Meta לא החזיר hash לתמונה')
  return hash
}

export async function uploadVideoCreative(
  adAccountId: string,
  videoBuffer: Buffer,
  accessToken: string
): Promise<string> {
  const accountId = normalizeAdAccountId(adAccountId)
  const form = new FormData()
  form.append('source', new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' }), 'creative.mp4')
  form.append('access_token', accessToken)

  const res = await fetch(`${META_API}/${accountId}/advideos`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json() as { id?: string; error?: { message: string; error_user_msg?: string } }
  if (!res.ok || !data.id) throw new Error(data.error?.error_user_msg ?? data.error?.message ?? `Meta error ${res.status}`)
  return data.id
}

export async function createAd({
  adAccountId, adsetId, name, imageHash, videoId,
  primaryText, headline, cta, destinationUrl, utm, status, accessToken
}: {
  adAccountId: string
  adsetId: string
  name: string
  imageHash?: string
  videoId?: string
  primaryText?: string
  headline?: string
  cta?: string
  destinationUrl?: string
  utm?: string
  status: 'PAUSED' | 'ACTIVE'
  accessToken: string
}): Promise<string> {
  const pageId = await getPageId(accessToken)
  const url = utm && destinationUrl ? `${destinationUrl}?${utm}` : destinationUrl

  const objectStorySpec: Record<string, unknown> = { page_id: pageId }

  if (imageHash) {
    objectStorySpec.link_data = {
      image_hash: imageHash,
      message: primaryText,
      name: headline,
      call_to_action: cta ? { type: cta, value: { link: url } } : undefined,
      link: url,
    }
  } else if (videoId) {
    objectStorySpec.video_data = {
      video_id: videoId,
      message: primaryText,
      title: headline,
      call_to_action: cta ? { type: cta, value: { link: url } } : undefined,
      link_description: url,
    }
  }

  const creativeRes = await fetch(`${META_API}/${adAccountId}/adcreatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, object_story_spec: objectStorySpec, access_token: accessToken }),
  })
  const creativeData = await creativeRes.json()
  if (creativeData.error) throw new Error(creativeData.error.message)

  const adRes = await fetch(`${META_API}/${adAccountId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      adset_id: adsetId,
      creative: { creative_id: creativeData.id },
      status,
      access_token: accessToken,
    }),
  })
  const adData = await adRes.json()
  if (adData.error) throw new Error(adData.error.message)
  return adData.id as string
}

async function getPageId(accessToken: string): Promise<string> {
  const res = await fetch(`${META_API}/me/accounts?access_token=${accessToken}`)
  const data = await res.json()
  if (data.error || !data.data?.[0]) throw new Error('No Facebook page found')
  return data.data[0].id as string
}

export async function refreshLongLivedToken(shortToken: string): Promise<{ token: string; expires: Date }> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const res = await fetch(
    `${META_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const expires = new Date(Date.now() + (data.expires_in || 5184000) * 1000)
  return { token: data.access_token, expires }
}
