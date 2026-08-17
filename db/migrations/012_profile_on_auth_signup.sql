-- 012_profile_on_auth_signup.sql
-- Automatically create a public.profiles row whenever a new row is inserted
-- into auth.users (i.e. whenever a new user signs up via Supabase Auth).
--
-- Idempotent:
--   * create or replace function
--   * drop trigger if exists before create
--   * insert ... on conflict (id) do nothing (no duplicate profiles)
--
-- Security:
--   * SECURITY DEFINER runs the insert as the function owner (postgres) so it
--     is not blocked by RLS on profiles, without exposing any extra grants.
--   * Restricted search_path prevents hijacking the function body.
--   * No GRANT statements are issued: the Auth service (supabase_auth_admin /
--     service_role) that inserts into auth.users invokes this trigger via the
--     standard Postgres/Supabase default privileges, so sign-up keeps working.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  name text := nullif(trim(coalesce(meta->>'full_name', '')), '');
begin
  insert into public.profiles (id, full_name, display_name, metadata)
  values (new.id, name, name, meta)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger: run the handler after every new auth user is created.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
