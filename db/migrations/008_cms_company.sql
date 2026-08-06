-- 008_cms_company.sql
-- Company CMS foundation: company_info, services, leadership, partnerships, future_vision_phases, csr, impact_categories, brand_identity, digital_presence

create table if not exists company_info (
  id uuid primary key default gen_random_uuid(),
  name_en text,
  name_bn text,
  founded_date date,
  location text,
  tagline_en text,
  tagline_bn text,
  slogan_en text,
  slogan_bn text,
  short_description_en text,
  short_description_bn text,
  long_description_en text,
  long_description_bn text,
  about_en text,
  about_bn text,
  story_en text,
  story_bn text,
  what_we_do_en text,
  what_we_do_bn text,
  approach_en text,
  approach_bn text,
  seo_title text,
  seo_description text,
  featured_media_id uuid references media(id),
  published boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger company_info_set_updated_at
before update on company_info
for each row execute function public.set_updated_at();

-- services
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title_en text,
  title_bn text,
  short_description_en text,
  short_description_bn text,
  description_en text,
  description_bn text,
  features jsonb,
  media_id uuid references media(id),
  published boolean default false,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger services_set_updated_at
before update on services
for each row execute function public.set_updated_at();

-- leadership
create table if not exists leadership (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  photo_media_id uuid references media(id),
  short_bio_en text,
  short_bio_bn text,
  full_bio_en text,
  full_bio_bn text,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger leadership_set_updated_at
before update on leadership
for each row execute function public.set_updated_at();

-- partnerships
create table if not exists partnerships (
  id uuid primary key default gen_random_uuid(),
  partner_name text,
  logo_media_id uuid references media(id),
  partnership_type text,
  project_event text,
  description text,
  start_date date,
  end_date date,
  website text,
  status text,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger partnerships_set_updated_at
before update on partnerships
for each row execute function public.set_updated_at();

-- future vision phases
create table if not exists future_vision_phases (
  id uuid primary key default gen_random_uuid(),
  phase integer not null,
  title_en text,
  title_bn text,
  focus_en text,
  focus_bn text,
  created_at timestamptz default now()
);

-- CSR
create table if not exists csr_sections (
  id uuid primary key default gen_random_uuid(),
  section_type text,
  title_en text,
  title_bn text,
  content_en text,
  content_bn text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger csr_set_updated_at
before update on csr_sections
for each row execute function public.set_updated_at();

-- impact categories
create table if not exists impact_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  title_en text,
  title_bn text,
  description text,
  created_at timestamptz default now()
);

-- brand identity (store token sets)
create table if not exists brand_identity (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  values jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger brand_identity_set_updated_at
before update on brand_identity
for each row execute function public.set_updated_at();

-- digital presence
create table if not exists digital_presence (
  id uuid primary key default gen_random_uuid(),
  website text,
  facebook text,
  instagram text,
  linkedin text,
  twitter text,
  youtube text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
