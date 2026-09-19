create extension if not exists pgcrypto;

create table if not exists public.nexo_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id text unique not null,
  profile_name text not null,
  telegram_link text not null,
  applicant_email text not null,
  contact_telegram text not null,
  relation text not null,
  note text,
  cover_path text not null,
  cover_name text not null,
  cover_mime text not null,
  cover_size bigint not null,
  authorized boolean not null default false,
  adult boolean not null default false,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','payment_processing','paid','email_sent','email_error','refunded','rejected')),
  paypal_order_id text unique,
  paypal_capture_id text unique,
  paypal_payer_email text,
  payment_amount numeric(10,2),
  payment_currency text,
  paid_at timestamptz,
  emails_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nexo_paypal_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  event_type text not null,
  received_at timestamptz not null default now()
);

create index if not exists nexo_submissions_status_created_idx
on public.nexo_submissions(status, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nexo-submissions',
  'nexo-submissions',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
