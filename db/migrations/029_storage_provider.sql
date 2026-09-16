-- 029_storage_provider.sql
-- Add storage_provider column to support Cloudflare R2.
-- Existing records keep their Supabase Storage paths in storage_path.
-- New uploads will use storage_provider = 'cloudflare_r2' and storage_path = R2 object key.

-- Add storage_provider column (defaults to 'supabase_storage' for existing records)
alter table media add column if not exists storage_provider text default 'supabase_storage';

-- Add index for querying by storage provider
create index if not exists idx_media_storage_provider on media(storage_provider);

-- Update existing records that have storage_path to reflect their provider
update media
set storage_provider = 'supabase_storage'
where storage_provider is null
  and storage_path is not null;

update media
set storage_provider = 'cloudflare_r2'
where storage_provider is null;

-- Ensure NOT NULL constraint on storage_provider
alter table media alter column storage_provider set not null;
