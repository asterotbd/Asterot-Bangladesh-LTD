-- Storage security audit for the public-media bucket
--
-- Run this in the Supabase SQL editor (or psql) to inspect the live state of
-- the storage bucket and its policies. It is read-only — it changes nothing.
--
-- Expected / desired state:
--   - buckets.public = true for public-media (public image URLs)
--   - NO INSERT / UPDATE / DELETE policies for anon or authenticated on
--     storage.objects referencing public-media (writes happen only via the
--     server-side admin API with the service role)

-- 1) Buckets: is public-media public?
select id, name, public, file_size_limit
from storage.buckets
order by name;

-- 2) All policies on storage.objects (the interesting ones)
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd, policyname;

-- 3) Write-capable policies that would let anon/authenticated modify the
--    public-media bucket directly (should return zero rows after hardening)
select
  p.policyname,
  p.cmd,
  p.roles,
  p.qual,
  p.with_check
from pg_policies p
where p.schemaname = 'storage'
  and p.tablename = 'objects'
  and p.cmd in ('INSERT', 'UPDATE', 'DELETE')
  and (p.roles::text like '%anon%' or p.roles::text like '%authenticated%')
  and (p.qual like '%public-media%' or p.with_check like '%public-media%');

-- 4) Any object in the bucket whose content-type is scriptable or non-image
--    (possible uploads that bypassed validation in the past)
select
  name,
  "owner",
  "metadata" ->> 'mimetype' as mimetype,
  "metadata" ->> 'size' as size_bytes,
  created_at
from storage.objects
where bucket_id = 'public-media'
  and (
    "metadata" ->> 'mimetype' not in ('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp')
    or lower(name) like '%.svg'
    or lower(name) like '%.html'
    or lower(name) like '%.htm'
  )
order by created_at desc;