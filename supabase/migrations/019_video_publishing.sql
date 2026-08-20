-- 019 Video publishing
-- Adds a published flag to media so admins can control which synced videos appear
-- on the public /media/videos page without re-syncing from YouTube.
alter table public.media
  add column if not exists published boolean not null default true;

create index if not exists idx_media_published on public.media(published);

update public.media set published = true where published is null;