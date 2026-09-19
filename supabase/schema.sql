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
  cover_uploaded boolean not null default false,
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
  submission_notified_at timestamptz,
  submission_email_error text,
  github_archive_last_at timestamptz,
  github_archive_error text,
  review_status text not null default 'new' check (review_status in ('new','reviewing','published','rejected')),
  admin_viewed_at timestamptz,
  review_started_at timestamptz,
  published_at timestamptz,
  rejected_at timestamptz,
  admin_notes text,
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


create table if not exists public.nexo_submission_events (
  id bigserial primary key,
  request_id text not null references public.nexo_submissions(request_id) on delete cascade,
  event_type text not null,
  label text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nexo_admin_passkeys (
  id bigserial primary key,
  credential_id text unique not null,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_name text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.nexo_admin_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null,
  challenge_type text not null check (challenge_type in ('register','authenticate')),
  rp_id text not null,
  origin text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.nexo_submission_events enable row level security;
alter table public.nexo_admin_passkeys enable row level security;
alter table public.nexo_admin_challenges enable row level security;

grant select, insert, update, delete on table public.nexo_submission_events to anon, authenticated;
grant select, insert, update, delete on table public.nexo_admin_passkeys to anon, authenticated;
grant select, insert, update, delete on table public.nexo_admin_challenges to anon, authenticated;
grant usage, select on sequence public.nexo_submission_events_id_seq to anon, authenticated;
grant usage, select on sequence public.nexo_admin_passkeys_id_seq to anon, authenticated;

drop policy if exists nexo_backend_all_submission_events on public.nexo_submission_events;
create policy nexo_backend_all_submission_events on public.nexo_submission_events
for all to anon, authenticated using (public.nexo_backend_authorized()) with check (public.nexo_backend_authorized());

drop policy if exists nexo_backend_all_admin_passkeys on public.nexo_admin_passkeys;
create policy nexo_backend_all_admin_passkeys on public.nexo_admin_passkeys
for all to anon, authenticated using (public.nexo_backend_authorized()) with check (public.nexo_backend_authorized());

drop policy if exists nexo_backend_all_admin_challenges on public.nexo_admin_challenges;
create policy nexo_backend_all_admin_challenges on public.nexo_admin_challenges
for all to anon, authenticated using (public.nexo_backend_authorized()) with check (public.nexo_backend_authorized());
