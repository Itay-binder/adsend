const META_API = 'https://graph.facebook.com/v22.0'

function normalizeAdAccountId(id) {
  return `act_${id.replace(/^act_/, '')}`
}

async function metaPost(path, body) {
  const form = new URLSearchParams()
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== null) {
      form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
    }
  }
  const res = await fetch(`${META_API}${path}`, { method: 'POST', body: form })
  const json = await res.json()
  if (!res.ok) {
    const e = json.error
    throw new Error(e?.error_user_msg?.trim() || e?.message?.trim() || `Meta error ${res.status}`)
  }
  return json
}

export async function getActiveCampaigns(adAccountId, accessToken) {
  const filtering = encodeURIComponent(JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]))
  const res = await fetch(
    `${META_API}/${adAccountId}/campaigns?fields=id,name,status,objective&filtering=${filtering}&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const campaigns = data.data ?? []
  return campaigns.filter(c => {
    const n = c.name.toLowerCase()
    return !n.startsWith('instagram post') && !n.startsWith('facebook post') && c.objective !== 'POST_ENGAGEMENT'
  })
}

export async function getAdSets(campaignId, accessToken) {
  const res = await fetch(
    `${META_API}/${campaignId}/adsets?fields=id,name,status&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const sets = data.data ?? []
  return sets.sort((a, b) => (b.status === 'ACTIVE' ? 1 : 0) - (a.status === 'ACTIVE' ? 1 : 0))
}

function extractSpecParams(spec) {
  const ld = spec.link_data
  const vd = spec.video_data
  const ldCta = ld?.call_to_action
  const vdCta = vd?.call_to_action
  const ctaType = ldCta?.type ?? vdCta?.type
  const ctaLink = ldCta?.value?.link ?? vdCta?.value?.link ?? ld?.link
  return {
    pageId: spec.page_id,
    message: ld?.message ?? vd?.message,
    headline: ld?.name ?? vd?.title,
    ctaType,
    link: ctaLink,
  }
}

function buildSpec(asset, p) {
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

function applyUtmToSpec(spec, campaignName, adName) {
  const slug = (s) => (s || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w֐-׿]/g, '').slice(0, 50)
  const addUtm = (url) => {
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

export async function buildAndCreateAd(adAccountId, adSetId, adName, asset, overrides, accessToken, campaignName) {
  const accountId = normalizeAdAccountId(adAccountId)

  const adsRes = await fetch(
    `${META_API}/${adSetId}/ads?fields=id,creative{id,object_story_spec}&limit=1&access_token=${accessToken}`
  )
  const adsData = await adsRes.json()
  const existingSpec = adsData.data?.[0]?.creative?.object_story_spec

  let params = existingSpec ? extractSpecParams(existingSpec) : {}
  if (!params.pageId) {
    const pageRes = await fetch(`${META_API}/me/accounts?access_token=${accessToken}`)
    const pageData = await pageRes.json()
    params.pageId = pageData.data?.[0]?.id
    if (!params.pageId) throw new Error('לא נמצא דף פייסבוק מחובר לחשבון')
  }

  if (overrides.link) params = { ...params, link: overrides.link }
  if (overrides.message) params = { ...params, message: overrides.message }

  let spec = buildSpec(asset, params)
  spec = applyUtmToSpec(spec, campaignName, adName)

  const creative = await metaPost(`/${accountId}/adcreatives`, {
    name: `${adName} - Creative`,
    object_story_spec: spec,
    access_token: accessToken,
  })
  if (!creative.id) throw new Error('יצירת קריאייטיב נכשלה')

  const ad = await metaPost(`/${accountId}/ads`, {
    name: adName,
    adset_id: adSetId,
    creative: { creative_id: creative.id },
    status: 'PAUSED',
    access_token: accessToken,
  })
  if (!ad.id) throw new Error('יצירת מודעה נכשלה')

  return ad.id
}

export async function activateAd(adId, accessToken) {
  await metaPost(`/${adId}`, { status: 'ACTIVE', access_token: accessToken })
}

export async function uploadImageCreative(adAccountId, imageBuffer, accessToken) {
  const accountId = normalizeAdAccountId(adAccountId)
  const base64 = imageBuffer.toString('base64')
  const form = new FormData()
  form.append('bytes', base64)
  form.append('access_token', accessToken)
  const res = await fetch(`${META_API}/${accountId}/adimages`, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error?.error_user_msg ?? data.error?.message ?? `Meta error ${res.status}`)
  const hash = Object.values(data.images ?? {})[0]?.hash
  if (!hash) throw new Error('Meta לא החזיר hash לתמונה')
  return hash
}

export async function uploadVideoCreative(adAccountId, videoBuffer, accessToken) {
  const accountId = normalizeAdAccountId(adAccountId)
  const form = new FormData()
  form.append('source', new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' }), 'creative.mp4')
  form.append('access_token', accessToken)
  const res = await fetch(`${META_API}/${accountId}/advideos`, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok || !data.id) throw new Error(data.error?.error_user_msg ?? data.error?.message ?? `Meta error ${res.status}`)
  return data.id
}
