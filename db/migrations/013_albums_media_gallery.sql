-- 013_albums_media_gallery.sql
-- Albums and album_photos referencing the existing media table.

-- albums table: a curated collection of photos
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_bn text,
  slug text not null unique,
  description_en text,
  description_bn text,
  cover_media_id uuid references media(id),
  published boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_albums_published on albums(published);
create index if not exists idx_albums_slug on albums(slug);

create trigger albums_set_updated_at
before update on albums
for each row execute function public.set_updated_at();

-- album_photos join table: photos (media rows) within an album
create table if not exists album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  "order" int default 0,
  created_at timestamptz default now(),
  constraint album_photos_album_media_unique unique(album_id, media_id)
);

create index if not exists idx_album_photos_album on album_photos(album_id);
