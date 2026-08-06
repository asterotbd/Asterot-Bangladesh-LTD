-- 001_create_core_tables.sql
-- Create roles, profiles, user_roles, and helper functions

create extension if not exists pgcrypto;

-- Roles table
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- Profiles table: link to auth.users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  phone text,
  locale text default 'en',
  avatar_path text,
  bio text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- user_roles mapping
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  created_at timestamptz default now(),
  constraint user_role_unique unique(user_id, role_id)
);

-- helper function: touch updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on profiles
for each row execute function public.set_updated_at();
