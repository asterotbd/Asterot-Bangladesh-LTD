-- 021 RLS for content tables
--
-- The publishable (anon) key is public by design and is exposed to the browser
-- (lib/supabaseBrowser.tsx). In Supabase, tables created in the public schema
-- are granted to anon/authenticated via default privileges, so tables WITHOUT
-- row-level security are fully open to anyone holding that key through the
-- Supabase REST API: drafts, unpublished and archived news/events, all media
-- rows, and categories can be read (and even modified) directly, even though
-- the website filters them.
--
-- This migration closes that gap. Public pages and the admin API both run
-- through the service role (which bypasses RLS), so the site itself is
-- unaffected — this only restricts direct anon/authenticated access.
--
-- Applies the same pattern already used for faq/homepage_sections/albums in
-- migration 017: public reads for published rows, staff management for
-- authenticated admins/editors, and service_role for the server.

alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.media enable row level security;
alter table public.categories enable row level security;

-- Public reads: only published rows.
create policy "news_public_read" on public.news
  for select to anon, authenticated
  using (published = true);

create policy "events_public_read" on public.events
  for select to anon, authenticated
  using (published = true);

create policy "media_public_read" on public.media
  for select to anon, authenticated
  using (published = true);

create policy "categories_public_read" on public.categories
  for select to anon, authenticated
  using (true);

-- Service role (server-side admin API and public pages) keeps full access.
create policy "news_admin_all" on public.news
  for all to service_role
  using (true) with check (true);

create policy "events_admin_all" on public.events
  for all to service_role
  using (true) with check (true);

create policy "media_admin_all" on public.media
  for all to service_role
  using (true) with check (true);

create policy "categories_admin_all" on public.categories
  for all to service_role
  using (true) with check (true);

-- Authenticated staff (admins/editors) may manage content rows directly for
-- operational use. Public-facing reads are still limited to published rows.
create policy "news_authenticated_manage" on public.news
  for all to authenticated
  using (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  )
  with check (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  );

create policy "events_authenticated_manage" on public.events
  for all to authenticated
  using (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  )
  with check (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  );

create policy "media_authenticated_manage" on public.media
  for all to authenticated
  using (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  )
  with check (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  );

create policy "categories_authenticated_manage" on public.categories
  for all to authenticated
  using (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  )
  with check (
    public.user_has_role(auth.uid(), 'super_admin') or
    public.user_has_role(auth.uid(), 'admin') or
    public.user_has_role(auth.uid(), 'editor')
  );

-- Grants (redundant with Supabase default privileges, kept explicit for clarity).
grant select on public.news, public.events, public.media, public.categories to anon, authenticated;
grant all on public.news, public.events, public.media, public.categories to service_role;