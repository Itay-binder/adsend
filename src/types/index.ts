export type UserPlan = 'trial' | 'active' | 'cancelled' | 'expired'

export interface AppUser {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  plan: UserPlan
  trial_ends_at: string | null
  created_at: string
}

export interface WhatsappSession {
  id: string
  user_id: string
  phone_number: string | null
  status: 'disconnected' | 'connecting' | 'connected'
  last_seen: string | null
}

export interface MetaConnection {
  id: string
  user_id: string
  token_expires_at: string | null
  created_at: string
}

export interface AdAccount {
  id: string
  user_id: string
  account_id: string
  account_name: string
  currency: string
  is_active: boolean
}

export interface Upload {
  id: string
  user_id: string
  ad_account_id: string
  campaign_id: string
  campaign_name: string
  adset_id: string
  adset_name: string
  meta_ad_id: string | null
  media_type: 'image' | 'video'
  primary_text: string | null
  headline: string | null
  cta: string | null
  destination_url: string | null
  utm: string | null
  status: 'PAUSED' | 'ACTIVE'
  created_at: string
}

export interface ParsedAdIntent {
  campaign_hint: string | null
  adset_hint: string | null
  primary_text: string | null
  headline: string | null
  cta: string | null
  destination_url: string | null
  utm: string | null
  status: 'PAUSED' | 'ACTIVE'
  confidence: 'high' | 'low'
  missing: string[]
}
