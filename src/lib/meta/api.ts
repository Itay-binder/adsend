const META_API = 'https://graph.facebook.com/v22.0'

function normalizeAdAccountId(id: string): string {
  return `act_${id.replace(/^act_/, '')}`
}

// POST helper — form-encoded like PowerCouple (proven to work)
async function metaPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const form = new URLSearchParams()
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== null) {
      form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
    }
  }
  const res = await fetch(`${META_API}${path}`, { method: 'POST', body: form })
  const json = await res.json() as T & { error?: { message?: string; error_user_msg?: string } }
  if (!res.ok) {
    const e = (json as Record<string, unknown>).error as Record<string, string> | undefined
    throw new Error(e?.error_user_msg?.trim() || e?.message?.trim() || `Meta error ${res.status}`)
  }
  return json
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

type ExistingAdSpec = {
  pageId?: string
  message?: string
  headline?: string
  ctaType?: string
  link?: string
}

function extractSpecParams(spec: Record<string, unknown>): ExistingAdSpec {
  const ld = spec.link_data as Record<string, unknown> | undefined
  const vd = spec.video_data as Record<string, unknown> | undefined
  const ldCta = ld?.call_to_action as Record<string, unknown> | undefined
  const vdCta = vd?.call_to_action as Record<string, unknown> | undefined
  const ctaType = (ldCta?.type ?? vdCta?.type) as string | undefined
  const ctaLink = (
    (ldCta?.value as Record<string, unknown> | undefined)?.link ??
    (vdCta?.value as Record<string, unknown> | undefined)?.link ??
    ld?.link
  ) as string | undefined
  return {
    pageId: spec.page_id as string | undefined,
    message: (ld?.message ?? vd?.message) as string | undefined,
    headline: (ld?.name ?? vd?.title) as string | undefined,
    ctaType,
    link: ctaLink,
  }
}

function buildSpec(
  asset: { type: 'image'; hash: string } | { type: 'video'; videoId: string },
  p: ExistingAdSpec
): Record<string, unknown> {
  const hasCta = p.ctaType && p.link
  if (asset.type === 'image') {
    return {
      page_id: p.pageId,
      link_data: {
        image_hash: asset.hash,
        ...(p.link ? { link: p.link } : {}),
        ...(p.message ? { message: p.message } : {}),
        ...(p.headline ? { name: p.headline } : {}),
        ...(hasCta ? { call_to_action: { type: p.ctaType, value: { link: p.link } } } : {}),
      },
    }
  } else {
    return {
      page_id: p.pageId,
      video_data: {
        video_id: asset.videoId,
        ...(p.message ? { message: p.message } : {}),
        ...(p.headline ? { title: p.headline } : {}),
        ...(hasCta ? { call_to_action: { type: p.ctaType, value: { link: p.link } } } : {}),
      },
    }
  }
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
  if (s.link_data?.call_to_action?.value?.link) s.link_data.call_to_action.value.link = addUtm(s.link_data.call_to_action.value.link)
  return s
}

export async function buildAndCreateAd(
  adAccountId: string,
  adSetId: string,
  adName: string,
  asset: { type: 'image'; hash: string } | { type: 'video'; videoId: string },
  overrides: { link?: string; message?: string },
  accessToken: string,
  campaignName: string
): Promise<string> {
  const accountId = normalizeAdAccountId(adAccountId)

  // 1. Get up to 10 ads from the adset, prefer one matching the upload type
  const adsRes = await fetch(
    `${META_API}/${adSetId}/ads?fields=id,creative{id,object_story_spec}&limit=10&access_token=${accessToken}`
  )
  const adsData = await adsRes.json()
  const allSpecs = ((adsData.data ?? []) as { creative?: { object_story_spec?: Record<string, unknown> } }[])
    .map(a => a.creative?.object_story_spec)
    .filter((s): s is Record<string, unknown> => !!s)

  const matchingSpec = asset.type === 'image'
    ? allSpecs.find(s => s.link_data)
    : allSpecs.find(s => s.video_data)
  const existingSpec = matchingSpec ?? allSpecs[0]

  // 2. Extract params from existing ad OR fetch page_id as fallback
  let params: ExistingAdSpec = existingSpec ? extractSpecParams(existingSpec) : {}
  if (!params.pageId) {
    const pageRes = await fetch(`${META_API}/me/accounts?access_token=${accessToken}`)
    const pageData = await pageRes.json()
    params.pageId = pageData.data?.[0]?.id
    if (!params.pageId) throw new Error('לא נמצא דף פייסבוק מחובר לחשבון')
  }

  // 3. Apply user overrides (link, copy)
  if (overrides.link) params = { ...params, link: overrides.link }
  if (overrides.message) params = { ...params, message: overrides.message }

  // 4. Build fresh spec + UTM
  let spec = buildSpec(asset, params)
  spec = applyUtmToSpec(spec, campaignName, adName)

  // 5. Create creative (form-encoded like PowerCouple)
  const creative = await metaPost<{ id?: string }>(`/${accountId}/adcreatives`, {
    name: `${adName} - Creative`,
    object_story_spec: spec,
    access_token: accessToken,
  })
  if (!creative.id) throw new Error('יצירת קריאייטיב נכשלה')

  // 6. Create ad
  const ad = await metaPost<{ id?: string }>(`/${accountId}/ads`, {
    name: adName,
    adset_id: adSetId,
    creative: { creative_id: creative.id },
    status: 'PAUSED',
    access_token: accessToken,
  })
  if (!ad.id) throw new Error('יצירת מודעה נכשלה')

  return ad.id
}

export async function activateAd(adId: string, accessToken: string): Promise<void> {
  await metaPost(`/${adId}`, { status: 'ACTIVE', access_token: accessToken })
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
  const res = await fetch(`${META_API}/${accountId}/adimages`, { method: 'POST', body: form })
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
  const res = await fetch(`${META_API}/${accountId}/advideos`, { method: 'POST', body: form })
  const data = await res.json() as { id?: string; error?: { message: string; error_user_msg?: string } }
  if (!res.ok || !data.id) throw new Error(data.error?.error_user_msg ?? data.error?.message ?? `Meta error ${res.status}`)
  return data.id
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
