-- 005_misc_tables.sql
-- contact_messages, site_settings, translations, notifications, audit_logs

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  inquiry_type text,
  subject text,
  message text,
  attached_files jsonb,
  status text default 'new',
  created_at timestamptz default now()
);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb,
  updated_at timestamptz default now()
);

create table if not exists translations (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  locale text not null,
  value text,
  created_at timestamptz default now(),
  constraint translations_unique unique (key, locale)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  type text,
  payload jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text,
  resource text,
  resource_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);
