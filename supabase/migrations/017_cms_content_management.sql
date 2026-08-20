-- 017 CMS content management
-- Adds FAQ, homepage section content, and publishing workflow columns for events/news.
-- Safe additive migration: creates new tables and columns only; backfills status from existing published flags.

-- ============================================================
-- FAQ
-- ============================================================
create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  answer_en text not null,
  question_bn text,
  answer_bn text,
  category text,
  display_order int not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_faq_published on public.faq(published, display_order);
create index if not exists idx_faq_category on public.faq(category);

create or replace function public.faq_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists faq_set_updated_at on public.faq;
create trigger faq_set_updated_at
  before update on public.faq
  for each row
  execute function public.faq_set_updated_at();

-- Seed the existing public FAQ content (12 entries from lib/faq.ts).
insert into public.faq (question_en, answer_en, category, display_order, published) values
  ('How do I register for an event?', 'Visit the Events page, select the event you are interested in, and click Register. You will be guided through a short registration form. Confirmation details are sent to your email.', 'General', 0, true),
  ('Are events free to attend?', 'Some events are free and others require a registration fee. Each event listing states whether participation is free or paid before registration.', 'Events', 1, true),
  ('Can I register a group or team?', 'Yes. Many of our tournaments and programs support group registrations. Use the event page to register each member or contact the organizers directly for bulk registration.', 'Events', 2, true),
  ('Do I need to be a member to join?', 'No. Anyone is welcome to participate in our events and programs. Membership is optional and offers additional benefits for recurring participation.', 'Membership', 3, true),
  ('How do I become a volunteer?', 'We are always looking for enthusiastic volunteers. Reach out through the Contact page with your interest and availability, and our team will respond with current opportunities.', 'Volunteering', 4, true),
  ('How can my organization partner with Asterot?', 'We collaborate with organizations on events, sponsorships, and CSR initiatives. Please contact us through the Contact page and our partnerships team will be in touch.', 'Partnerships', 5, true),
  ('What kind of events does Asterot organize?', 'We organize sports tournaments, corporate events, live performances, conferences, entertainment programs, and community gatherings across Bangladesh.', 'Events', 6, true),
  ('Do you offer event management services?', 'Yes. We provide full-service event planning and execution, from concept and logistics to on-ground delivery for organizations and brands.', 'Services', 7, true),
  ('Where are events usually held?', 'Events are held in Dhaka and across Bangladesh. The location for each event is listed on its event page.', 'Events', 8, true),
  ('How can I stay updated about upcoming events?', 'Follow us on social media and check the Events page regularly. You can also contact us directly to join our announcement list.', 'General', 9, true),
  ('Can I sponsor an event?', 'Yes. Sponsorship opportunities are available across our events and programs. Contact us to discuss branding, visibility, and partnership benefits.', 'Partnerships', 10, true),
  ('Who can I contact for support?', 'Use the Contact page to reach our support team. We aim to respond within two business days.', 'Support', 11, true)
on conflict (id) do nothing;

-- ============================================================
-- Homepage sections (hero, capabilities, featured event, companies)
-- ============================================================
create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  heading text,
  subtitle text,
  body text,
  cta_text text,
  cta_url text,
  image_media_id uuid references public.media(id) on delete set null,
  visible boolean not null default true,
  display_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_homepage_sections_visible on public.homepage_sections(visible, display_order);

create or replace function public.homepage_sections_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists homepage_sections_set_updated_at on public.homepage_sections;
create trigger homepage_sections_set_updated_at
  before update on public.homepage_sections
  for each row
  execute function public.homepage_sections_set_updated_at();

-- Seed the current homepage content (from app/page.tsx and components/Hero.tsx) so
-- the CMS shows the live values out of the box.
insert into public.homepage_sections (section_key, heading, subtitle, body, cta_text, cta_url, visible, display_order) values
  ('hero',
   'Igniting Change with every step.',
   'Asterot Bangladesh Limited organizes events and programs that empower young people and communities across Bangladesh.',
   null,
   'Explore Our Events',
   '/events',
   true,
   10),
  ('capabilities',
   'What We Do',
   'Everything from strategy to stage — we design, organize, and deliver experiences that move people.',
   null,
   'Partner With Us',
   '/about',
   true,
   20),
  ('featured_event',
   'Awakening Cup',
   'A national-level tournament bringing together the most promising young football talent in Bangladesh.',
   null,
   'Learn More',
   '/events/awakening-cup',
   true,
   30),
  ('companies',
   'Companies We''ve Worked With',
   null,
   null,
   null,
   null,
   true,
   40)
on conflict (section_key) do nothing;

-- ============================================================
-- Publishing workflow for events and news
-- Adds a status column (draft | published | archived) that is kept in sync
-- with the existing published boolean used by the public site.
-- ============================================================
alter table public.events
  add column if not exists status text not null default 'draft'
  check (status in ('draft', 'published', 'archived'));

alter table public.news
  add column if not exists status text not null default 'draft'
  check (status in ('draft', 'published', 'archived'));

-- Featured flag for events (drives homepage featured event selection).
alter table public.events
  add column if not exists featured boolean not null default false;

-- Backfill status from existing published flags.
update public.events set status = 'published' where published = true and status = 'draft';
update public.news set status = 'published' where published = true and status = 'draft';

-- Keep status and published in sync for any legacy writes that only set one.
create or replace function public.events_sync_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    new.published = true;
  elsif new.status = 'draft' or new.status = 'archived' then
    new.published = false;
  end if;
  return new;
end;
$$;

drop trigger if exists events_sync_status on public.events;
create trigger events_sync_status
  before insert or update on public.events
  for each row
  execute function public.events_sync_status();

create or replace function public.news_sync_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' then
    new.published = true;
  elsif new.status = 'draft' or new.status = 'archived' then
    new.published = false;
  end if;
  return new;
end;
$$;

drop trigger if exists news_sync_status on public.news;
create trigger news_sync_status
  before insert or update on public.news
  for each row
  execute function public.news_sync_status();

-- ============================================================
-- RLS policies
-- ============================================================
alter table public.faq enable row level security;
alter table public.homepage_sections enable row level security;

-- FAQ: public can read published items; admins manage all.
create policy "faq_public_read" on public.faq
  for select to anon, authenticated
  using (published = true);
create policy "faq_admin_all" on public.faq
  for all to service_role
  using (true) with check (true);
create policy "faq_authenticated_manage" on public.faq
  for all to authenticated
  using (public.user_has_role(auth.uid(), 'super_admin') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'editor'))
  with check (public.user_has_role(auth.uid(), 'super_admin') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'editor'));

-- Homepage sections: public reads visible items; admins manage all.
create policy "homepage_sections_public_read" on public.homepage_sections
  for select to anon, authenticated
  using (visible = true);
create policy "homepage_sections_admin_all" on public.homepage_sections
  for all to service_role
  using (true) with check (true);
create policy "homepage_sections_authenticated_manage" on public.homepage_sections
  for all to authenticated
  using (public.user_has_role(auth.uid(), 'super_admin') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'editor'))
  with check (public.user_has_role(auth.uid(), 'super_admin') or public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'editor'));

-- Album RLS already enabled? Ensure albums/album_photos have sensible policies for the public gallery.
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

create policy "albums_public_read" on public.albums
  for select to anon, authenticated
  using (published = true);
create policy "albums_admin_all" on public.albums
  for all to service_role
  using (true) with check (true);

create policy "album_photos_public_read" on public.album_photos
  for select to anon, authenticated
  using (exists (select 1 from public.albums a where a.id = album_photos.album_id and a.published = true));
create policy "album_photos_admin_all" on public.album_photos
  for all to service_role
  using (true) with check (true);

-- ============================================================
-- Audit log RLS (already enabled with no policies in migration 015).
-- Add a policy so admin (super_admin/admin) can read the audit trail via
-- their own session, since some dashboards may use the user-scoped client.
-- ============================================================
create policy "audit_logs_admin_read" on public.audit_logs
  for select to authenticated
  using (public.user_has_role(auth.uid(), 'super_admin') or public.user_has_role(auth.uid(), 'admin'));

-- ============================================================
-- Grants
-- ============================================================
grant select on public.faq, public.homepage_sections, public.albums, public.album_photos to anon, authenticated;
grant all on public.faq, public.homepage_sections, public.albums, public.album_photos to service_role;