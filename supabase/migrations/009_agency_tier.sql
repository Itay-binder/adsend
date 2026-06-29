-- Agency tier — a second subscription level.
-- "basic"  = the existing plan: a single connected ad account.
-- "agency" = may connect several ad accounts; the WhatsApp bot asks which
--            account before every command when more than one is connected.
--
-- Run this whole block in the Supabase SQL editor.

-- 1. Subscription tier flag (defaults to basic so nothing changes for existing users)
alter table public.subscriptions
  add column if not exists tier text not null default 'basic';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscriptions_tier_check'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_tier_check check (tier in ('basic','agency'));
  end if;
end $$;

-- 2. Which ad account the current WhatsApp flow is locked to (agency multi-account)
alter table public.whatsapp_pending
  add column if not exists account_id text;

-- 3. Mark Itay as an agency subscriber (creates the row if missing, else flips the flag)
insert into public.subscriptions (user_id, status, tier)
select u.id, 'active', 'agency'
from auth.users u
where u.email = 'itay@binder.co.il'
on conflict (user_id) do update set tier = 'agency';
