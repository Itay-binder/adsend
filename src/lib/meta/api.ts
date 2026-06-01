const META_API = 'https://graph.facebook.com/v20.0'

export async function getAdAccounts(accessToken: string) {
  const res = await fetch(
    `${META_API}/me/adaccounts?fields=id,name,currency,account_status&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data as { id: string; name: string; currency: string; account_status: number }[]
}

export async function getActiveCampaigns(adAccountId: string, accessToken: string) {
  const res = await fetch(
    `${META_API}/${adAccountId}/campaigns?fields=id,name,status,objective&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data as { id: string; name: string; status: string }[]
}

export async function getAdSets(campaignId: string, accessToken: string) {
  const res = await fetch(
    `${META_API}/${campaignId}/adsets?fields=id,name,status&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]&limit=50&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data as { id: string; name: string; status: string }[]
}

export async function uploadImageCreative(
  adAccountId: string,
  imageBuffer: Buffer,
  accessToken: string
): Promise<string> {
  const FormData = (await import('form-data')).default
  const form = new FormData()
  form.append('source', imageBuffer, { filename: 'creative.jpg', contentType: 'image/jpeg' })
  form.append('access_token', accessToken)

  const res = await fetch(`${META_API}/${adAccountId}/adimages`, {
    method: 'POST',
    body: form as unknown as BodyInit,
    headers: form.getHeaders(),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const images = data.images
  const hash = Object.values(images)[0] as { hash: string }
  return hash.hash
}

export async function uploadVideoCreative(
  adAccountId: string,
  videoBuffer: Buffer,
  accessToken: string
): Promise<string> {
  const FormData = (await import('form-data')).default
  const form = new FormData()
  form.append('source', videoBuffer, { filename: 'creative.mp4', contentType: 'video/mp4' })
  form.append('access_token', accessToken)

  const res = await fetch(`${META_API}/${adAccountId}/advideos`, {
    method: 'POST',
    body: form as unknown as BodyInit,
    headers: form.getHeaders(),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id as string
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
