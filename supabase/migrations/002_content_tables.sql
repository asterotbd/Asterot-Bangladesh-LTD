-- 002_content_tables.sql
-- Projects, events, news, portfolio, categories, corporate_services

-- categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_bn text,
  slug text not null unique,
  type text not null,
  created_at timestamptz default now()
);

-- projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_bn text,
  slug text not null unique,
  summary_en text,
  summary_bn text,
  content_en text,
  content_bn text,
  category_id uuid references categories(id),
  featured boolean default false,
  published boolean default false,
  start_date date,
  end_date date,
  location text,
  registration_required boolean default false,
  capacity integer,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_published on projects(published);
create index if not exists idx_projects_slug on projects(slug);

create trigger projects_set_updated_at
before update on projects
for each row execute function public.set_updated_at();

-- events (can overlap with projects)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_bn text,
  slug text not null unique,
  description_en text,
  description_bn text,
  category_id uuid references categories(id),
  date date,
  time time,
  location text,
  registration_deadline timestamptz,
  capacity integer,
  published boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_events_published on events(published);

create trigger events_set_updated_at
before update on events
for each row execute function public.set_updated_at();

-- news
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_bn text,
  slug text not null unique,
  subtitle_en text,
  subtitle_bn text,
  excerpt_en text,
  excerpt_bn text,
  content_en text,
  content_bn text,
  category_id uuid references categories(id),
  author_id uuid references auth.users(id),
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_news_published on news(published, published_at);

create trigger news_set_updated_at
before update on news
for each row execute function public.set_updated_at();

-- portfolio items
create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_bn text,
  slug text not null unique,
  description_en text,
  description_bn text,
  category_id uuid references categories(id),
  client text,
  date date,
  location text,
  featured boolean default false,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger portfolio_set_updated_at
before update on portfolio_items
for each row execute function public.set_updated_at();

-- corporate services
create table if not exists corporate_services (
  id uuid primary key default gen_random_uuid(),
  title_en text,
  title_bn text,
  slug text unique,
  description_en text,
  description_bn text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger corporate_services_set_updated_at
before update on corporate_services
for each row execute function public.set_updated_at();
