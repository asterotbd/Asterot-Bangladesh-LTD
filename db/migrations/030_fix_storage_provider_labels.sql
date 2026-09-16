-- 030_fix_storage_provider_labels.sql
--
-- 029 added media.storage_provider with DEFAULT 'supabase_storage'. Adding a
-- column that has a default makes Postgres write that value into every
-- existing row immediately, so 029's follow-up UPDATEs (which only match rows
-- where the column IS NULL) never matched anything. On the live database this
-- labelled every row 'supabase_storage', including admin uploads that live in
-- R2 under uploads/ and the seed photos served from R2, and it left new rows
-- defaulting to Supabase although new uploads can only go to R2.
--
-- The application chooses a storage backend from the object key, not from this
-- column, so this corrects the data; it does not fix a user-visible outage.

begin;

-- Objects the admin uploader wrote to R2.
update media
set storage_provider = 'cloudflare_r2'
where storage_path like 'uploads/%'
  and storage_provider is distinct from 'cloudflare_r2';

-- Rows with no stored object: seed photos migrated from public/ (served from
-- R2) and YouTube videos. This is the value 029 intended for them.
update media
set storage_provider = 'cloudflare_r2'
where storage_path is null
  and storage_provider is distinct from 'cloudflare_r2';

-- Rows under admin/ are genuine Supabase Storage objects and keep that label.

-- New rows: the Supabase upload fallback has been removed, so R2 is the only
-- place a new upload can go.
alter table media alter column storage_provider set default 'cloudflare_r2';

commit;

-- Verify:
--   select storage_provider, count(*) from media group by 1;
