-- 020 Storage hardening for the public-media bucket
--
-- The media library writes to Supabase Storage exclusively through the
-- server-side admin API (app/api/admin/media/*) using the service role, and
-- deletes the same way. Neither the anon nor the authenticated role should be
-- able to INSERT / UPDATE / DELETE objects in the public-media bucket — such
-- policies would let anyone overwrite or remove site images (or host arbitrary
-- content) by talking to Storage directly.
--
-- The bucket stays public (so public image URLs keep working), and read access
-- for anon/authenticated is unaffected.
--
-- This migration is idempotent and safe to apply multiple times.

-- Ensure the bucket exists and is public.
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

-- Revoke any write (INSERT / UPDATE / DELETE) policies granted to anon or
-- authenticated roles that reference the public-media bucket. Read (SELECT)
-- policies are intentionally left untouched.
do $$
declare
  pol record;
begin
  for pol in
    select p.policyname
    from pg_policies p
    where p.schemaname = 'storage'
      and p.tablename = 'objects'
      and p.cmd in ('INSERT', 'UPDATE', 'DELETE')
      and (p.roles::text like '%anon%' or p.roles::text like '%authenticated%')
      and (p.qual like '%public-media%' or p.with_check like '%public-media%')
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

-- Optional (recommended): ensure authenticated/anon users can list objects in
-- the bucket through the Storage API. Public URLs work regardless, but a read
-- policy keeps the Dashboard and API listing functional for public buckets.
-- (CREATE POLICY has no IF NOT EXISTS clause; drop-then-create keeps it idempotent.)
drop policy if exists "public-media public read" on storage.objects;
create policy "public-media public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'public-media');