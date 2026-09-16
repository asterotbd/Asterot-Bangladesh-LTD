-- 029_storage_provider.sql
-- Add storage_provider column to support Cloudflare R2.

alter table media add column if not exists storage_provider text default 'supabase_storage';

create index if not exists idx_media_storage_provider on media(storage_provider);

update media
set storage_provider = 'supabase_storage'
where storage_provider is null
  and storage_path is not null;

update media
set storage_provider = 'cloudflare_r2'
where storage_provider is null;

alter table media alter column storage_provider set not null;
