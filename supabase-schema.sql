-- Run this in Supabase SQL editor

create table if not exists public.whatsapp_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  phone_number text,
  status text default 'disconnected' check (status in ('disconnected','connecting','connected')),
  last_seen timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meta_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  access_token text not null,
  token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ad_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  account_id text not null,
  account_name text not null,
  currency text default 'ILS',
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, account_id)
);

create table if not exists public.uploads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id),
  campaign_id text not null,
  campaign_name text not null,
  adset_id text not null,
  adset_name text not null,
  meta_ad_id text,
  media_type text check (media_type in ('image','video')),
  primary_text text,
  headline text,
  cta text,
  destination_url text,
  utm text,
  status text default 'PAUSED' check (status in ('PAUSED','ACTIVE')),
  created_at timestamptz default now()
);

create table if not exists public.whatsapp_pending (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  media_base64 text,
  media_type text,
  intent text,
  step text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  primary_text text,
  headline text,
  cta text,
  destination_url text,
  utm text,
  status text default 'PAUSED',
  campaigns text,
  adsets text,
  updated_at timestamptz default now()
);

-- RLS policies
alter table public.whatsapp_sessions enable row level security;
alter table public.meta_connections enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.uploads enable row level security;
alter table public.whatsapp_pending enable row level security;

create policy "Users manage own wa session" on public.whatsapp_sessions for all using (auth.uid() = user_id);
create policy "Users manage own meta conn" on public.meta_connections for all using (auth.uid() = user_id);
create policy "Users manage own ad accounts" on public.ad_accounts for all using (auth.uid() = user_id);
create policy "Users see own uploads" on public.uploads for all using (auth.uid() = user_id);
create policy "Users manage own pending" on public.whatsapp_pending for all using (auth.uid() = user_id);

-- Service role bypass for webhook
create policy "Service role full access wa sessions" on public.whatsapp_sessions for all to service_role using (true);
create policy "Service role full access meta" on public.meta_connections for all to service_role using (true);
create policy "Service role full access ad accounts" on public.ad_accounts for all to service_role using (true);
create policy "Service role full access uploads" on public.uploads for all to service_role using (true);
create policy "Service role full access pending" on public.whatsapp_pending for all to service_role using (true);
