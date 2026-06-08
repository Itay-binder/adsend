-- Per-customer activity log. Every meaningful event lands here so we can
-- derive DAU/MAU, time-to-conversion, retention, funnel, etc.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  params jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists events_user_id_created_at_idx
  on public.events(user_id, created_at desc);

create index if not exists events_name_created_at_idx
  on public.events(name, created_at desc);

create index if not exists events_user_name_idx
  on public.events(user_id, name);
