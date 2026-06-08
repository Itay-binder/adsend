-- Cardcom payment page fills in customer details that aren't in auth.users.
-- We pull them off every webhook callback and keep one row per user so the
-- CRM, the disconnect webhook payload, and any future segmentation have a
-- single source of truth for "who this customer is."
create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  payment_email text,
  phone text,
  national_id text,
  full_name text,
  address text,
  city text,
  zip text,
  source text default 'cardcom',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customer_profiles_user_id_idx
  on public.customer_profiles(user_id);
create index if not exists customer_profiles_phone_idx
  on public.customer_profiles(phone);
create index if not exists customer_profiles_payment_email_idx
  on public.customer_profiles(payment_email);
