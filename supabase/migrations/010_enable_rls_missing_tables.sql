-- 010 — Enable Row Level Security on tables that were added after the initial
-- schema and shipped WITHOUT RLS. Without RLS, anyone holding the public anon
-- key (which ships in the browser bundle) can read/write these tables directly
-- via PostgREST, bypassing the app's user_id filters.
--
-- Access patterns were verified before writing these policies:
--   events             — written/read ONLY via service-role (events.ts, baileys,
--                        crons, save-phone, auth/callback). No anon access.
--   customer_profiles  — written/read ONLY via service-role (cardcom webhook, CRM).
--   founder_leads      — written/read ONLY via service-role (founder-lead route, CRM).
--                        No user_id column → locked to service-role entirely.
--   whatsapp_allowed_numbers — the customer reads/writes this with the anon key
--                        (settings page) AND baileys/CRM use service-role. Needs a
--                        per-user policy so the settings page keeps working.
--
-- Re-runnable: each policy is dropped-if-exists before being (re)created.
-- (service_role bypasses RLS in Supabase anyway; the explicit policies just
--  document intent and match the existing schema's style.)

-- ── events ───────────────────────────────────────────────────────────────────
alter table public.events enable row level security;

drop policy if exists "Users see own events" on public.events;
create policy "Users see own events" on public.events
  for select using (auth.uid() = user_id);

drop policy if exists "Service role full access events" on public.events;
create policy "Service role full access events" on public.events
  for all to service_role using (true) with check (true);

-- ── customer_profiles ────────────────────────────────────────────────────────
alter table public.customer_profiles enable row level security;

drop policy if exists "Users see own profile" on public.customer_profiles;
create policy "Users see own profile" on public.customer_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Service role full access profiles" on public.customer_profiles;
create policy "Service role full access profiles" on public.customer_profiles
  for all to service_role using (true) with check (true);

-- ── founder_leads (no user_id → service-role only, fully private) ─────────────
alter table public.founder_leads enable row level security;

drop policy if exists "Service role full access founder leads" on public.founder_leads;
create policy "Service role full access founder leads" on public.founder_leads
  for all to service_role using (true) with check (true);

-- ── whatsapp_allowed_numbers ─────────────────────────────────────────────────
-- Ensure the table exists (it was created in the Supabase dashboard and never
-- version-controlled). create-if-not-exists is a no-op if it already exists.
create table if not exists public.whatsapp_allowed_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  phone_number text not null,
  label text,
  created_at timestamptz default now()
);

alter table public.whatsapp_allowed_numbers enable row level security;

drop policy if exists "Users manage own allowed numbers" on public.whatsapp_allowed_numbers;
create policy "Users manage own allowed numbers" on public.whatsapp_allowed_numbers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Service role full access allowed numbers" on public.whatsapp_allowed_numbers;
create policy "Service role full access allowed numbers" on public.whatsapp_allowed_numbers
  for all to service_role using (true) with check (true);
