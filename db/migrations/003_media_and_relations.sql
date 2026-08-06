-- 003_media_and_relations.sql
-- Media, project_media, sponsors, partners, media metadata

-- media table: stores metadata only
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  storage_path text,
  public_url text,
  type text not null, -- photo, video, embed
  provider text, -- uploaded, youtube, vimeo
  alt_en text,
  alt_bn text,
  caption_en text,
  caption_bn text,
  width int,
  height int,
  filesize bigint,
  metadata jsonb,
  category text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_media_type on media(type);

-- news.featured_image FK (added here because media is created in this migration)
alter table news add column if not exists featured_image uuid references media(id);

-- project_media join
create table if not exists project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  "order" int default 0,
  role text,
  created_at timestamptz default now()
);

-- sponsors and partners
create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_media_id uuid references media(id),
  website text,
  description_en text,
  description_bn text,
  created_at timestamptz default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_media_id uuid references media(id),
  website text,
  description_en text,
  description_bn text,
  created_at timestamptz default now()
);
