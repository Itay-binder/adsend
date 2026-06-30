-- 010 — Enable Row Level Security on tables that were added after the initial
-- schema and shipped WITHOUT RLS. Without RLS, anyone holding the public anon
-- key (which ships in the browser bundle) can read/write these tables directly
-- via PostgREST, bypassing the app's user_id filters.
--
-- Access patterns were verified before writing these policies:
--   events             — written/read ONLY via service-role (events.ts, baileys,
--                        crons, save-phone, auth/callback). No anon access.
--   customer_profiles  — written/read ONLY via service-role (CRM). NOTE: as of
--                        2026-06 this table does not exist in the DB (migration 007
--                        was never applied and no code references it) — skipped.
--   founder_leads      — written/read ONLY via service-role (founder-lead route, CRM).
--                        No user_id column → locked to service-role entirely.
--   whatsapp_allowed_numbers — the customer reads/writes this with the anon key
--                        (settings page) AND baileys/CRM use service-role. Needs a
--                        per-user policy so the settings page keeps working.
--
-- Resilient: wrapped in a DO block that only touches tables that actually exist,
-- so a missing table (e.g. customer_profiles) is skipped instead of aborting the
-- whole migration. Re-runnable: each policy is dropped-if-exists first.
-- (service_role bypasses RLS in Supabase anyway; explicit policies document intent.)

do $$
begin
  -- ── events ─────────────────────────────────────────────────────────────────
  if to_regclass('public.events') is not null then
    execute 'alter table public.events enable row level security';
    execute 'drop policy if exists "Users see own events" on public.events';
    execute 'create policy "Users see own events" on public.events for select using (auth.uid() = user_id)';
    execute 'drop policy if exists "Service role full access events" on public.events';
    execute 'create policy "Service role full access events" on public.events for all to service_role using (true) with check (true)';
    raise notice 'events: RLS enabled';
  else raise notice 'events: SKIPPED (table missing)'; end if;

  -- ── customer_profiles ──────────────────────────────────────────────────────
  if to_regclass('public.customer_profiles') is not null then
    execute 'alter table public.customer_profiles enable row level security';
    execute 'drop policy if exists "Users see own profile" on public.customer_profiles';
    execute 'create policy "Users see own profile" on public.customer_profiles for select using (auth.uid() = user_id)';
    execute 'drop policy if exists "Service role full access profiles" on public.customer_profiles';
    execute 'create policy "Service role full access profiles" on public.customer_profiles for all to service_role using (true) with check (true)';
    raise notice 'customer_profiles: RLS enabled';
  else raise notice 'customer_profiles: SKIPPED (table missing)'; end if;

  -- ── founder_leads (no user_id → service-role only, fully private) ───────────
  if to_regclass('public.founder_leads') is not null then
    execute 'alter table public.founder_leads enable row level security';
    execute 'drop policy if exists "Service role full access founder leads" on public.founder_leads';
    execute 'create policy "Service role full access founder leads" on public.founder_leads for all to service_role using (true) with check (true)';
    raise notice 'founder_leads: RLS enabled';
  else raise notice 'founder_leads: SKIPPED (table missing)'; end if;

  -- ── whatsapp_allowed_numbers ───────────────────────────────────────────────
  if to_regclass('public.whatsapp_allowed_numbers') is not null then
    execute 'alter table public.whatsapp_allowed_numbers enable row level security';
    execute 'drop policy if exists "Users manage own allowed numbers" on public.whatsapp_allowed_numbers';
    execute 'create policy "Users manage own allowed numbers" on public.whatsapp_allowed_numbers for all using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'drop policy if exists "Service role full access allowed numbers" on public.whatsapp_allowed_numbers';
    execute 'create policy "Service role full access allowed numbers" on public.whatsapp_allowed_numbers for all to service_role using (true) with check (true)';
    raise notice 'whatsapp_allowed_numbers: RLS enabled';
  else raise notice 'whatsapp_allowed_numbers: SKIPPED (table missing)'; end if;
end $$;
