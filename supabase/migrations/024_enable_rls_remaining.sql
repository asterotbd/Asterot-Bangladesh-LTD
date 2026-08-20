-- 024_enable_rls_remaining.sql
-- Enable RLS on the remaining public-schema tables.
--
-- Migration 021 closed the anon/authenticated write gap for
-- news/events/media/categories and migration 017 did the same for
-- faq/homepage_sections/albums. The tables below were created before RLS
-- discipline was applied and, under Supabase default privileges, anon and
-- authenticated hold ALL on them through the public publishable key
-- (lib/supabaseBrowser.tsx). Anyone with that key could read and MODIFY
-- site_settings, unpublished projects, leadership, company content,
-- translations, etc. directly through the Supabase REST API.
--
-- This migration enables RLS on all of them:
--   * Public content tables get a public SELECT (read-only) policy mirroring
--     the live site; unpublished rows stay hidden.
--   * site_settings is configuration data and gets NO anon/authenticated
--     policy at all (service role only).
--   * No anon/authenticated INSERT/UPDATE/DELETE policies are created
--     anywhere. All admin mutations flow through the server-side API routes
--     using the service-role client (which bypasses RLS), so the website and
--     the admin API keep working unchanged.
--
-- Additionally:
--   * Fixes the audit_logs SELECT grant so the "audit_logs_admin_read" policy
--     from migration 017 actually takes effect for authenticated admins
--     (migration 015 revoked all anon/authenticated grants but never
--     re-granted SELECT).
--   * Revokes the unnecessary anon EXECUTE on the role-management RPCs; anon
--     callers always failed the auth.uid() check, so this removes dead surface.

-- ============================================================
-- 1. RLS on content tables with a `published` column
--    (public read only for published rows)
-- ============================================================
alter table public.projects enable row level security;
create policy "projects_public_read" on public.projects
  for select to anon, authenticated
  using (published = true);
create policy "projects_admin_all" on public.projects
  for all to service_role
  using (true) with check (true);

alter table public.portfolio_items enable row level security;
create policy "portfolio_items_public_read" on public.portfolio_items
  for select to anon, authenticated
  using (published = true);
create policy "portfolio_items_admin_all" on public.portfolio_items
  for all to service_role
  using (true) with check (true);

alter table public.company_info enable row level security;
create policy "company_info_public_read" on public.company_info
  for select to anon, authenticated
  using (published = true);
create policy "company_info_admin_all" on public.company_info
  for all to service_role
  using (true) with check (true);

alter table public.services enable row level security;
create policy "services_public_read" on public.services
  for select to anon, authenticated
  using (published = true);
create policy "services_admin_all" on public.services
  for all to service_role
  using (true) with check (true);

alter table public.leadership enable row level security;
create policy "leadership_public_read" on public.leadership
  for select to anon, authenticated
  using (published = true);
create policy "leadership_admin_all" on public.leadership
  for all to service_role
  using (true) with check (true);

-- ============================================================
-- 2. RLS on public content tables without a `published` column
--    (public read for all rows; no writes)
-- ============================================================
alter table public.corporate_services enable row level security;
create policy "corporate_services_public_read" on public.corporate_services
  for select to anon, authenticated
  using (true);
create policy "corporate_services_admin_all" on public.corporate_services
  for all to service_role
  using (true) with check (true);

alter table public.project_media enable row level security;
create policy "project_media_public_read" on public.project_media
  for select to anon, authenticated
  using (exists (
    select 1 from public.projects p where p.id = project_media.project_id and p.published = true
  ));
create policy "project_media_admin_all" on public.project_media
  for all to service_role
  using (true) with check (true);

alter table public.sponsors enable row level security;
create policy "sponsors_public_read" on public.sponsors
  for select to anon, authenticated
  using (true);
create policy "sponsors_admin_all" on public.sponsors
  for all to service_role
  using (true) with check (true);

alter table public.partners enable row level security;
create policy "partners_public_read" on public.partners
  for select to anon, authenticated
  using (true);
create policy "partners_admin_all" on public.partners
  for all to service_role
  using (true) with check (true);

alter table public.partnerships enable row level security;
create policy "partnerships_public_read" on public.partnerships
  for select to anon, authenticated
  using (true);
create policy "partnerships_admin_all" on public.partnerships
  for all to service_role
  using (true) with check (true);

alter table public.future_vision_phases enable row level security;
create policy "future_vision_phases_public_read" on public.future_vision_phases
  for select to anon, authenticated
  using (true);
create policy "future_vision_phases_admin_all" on public.future_vision_phases
  for all to service_role
  using (true) with check (true);

alter table public.csr_sections enable row level security;
create policy "csr_sections_public_read" on public.csr_sections
  for select to anon, authenticated
  using (true);
create policy "csr_sections_admin_all" on public.csr_sections
  for all to service_role
  using (true) with check (true);

alter table public.impact_categories enable row level security;
create policy "impact_categories_public_read" on public.impact_categories
  for select to anon, authenticated
  using (true);
create policy "impact_categories_admin_all" on public.impact_categories
  for all to service_role
  using (true) with check (true);

alter table public.brand_identity enable row level security;
create policy "brand_identity_public_read" on public.brand_identity
  for select to anon, authenticated
  using (true);
create policy "brand_identity_admin_all" on public.brand_identity
  for all to service_role
  using (true) with check (true);

alter table public.digital_presence enable row level security;
create policy "digital_presence_public_read" on public.digital_presence
  for select to anon, authenticated
  using (true);
create policy "digital_presence_admin_all" on public.digital_presence
  for all to service_role
  using (true) with check (true);

alter table public.translations enable row level security;
create policy "translations_public_read" on public.translations
  for select to anon, authenticated
  using (true);
create policy "translations_admin_all" on public.translations
  for all to service_role
  using (true) with check (true);

-- ============================================================
-- 3. site_settings: configuration data, service role only.
--    No anon/authenticated policies at all.
-- ============================================================
alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;

-- ============================================================
-- 4. Grants
-- ============================================================
grant select on
  public.projects,
  public.portfolio_items,
  public.corporate_services,
  public.project_media,
  public.sponsors,
  public.partners,
  public.partnerships,
  public.future_vision_phases,
  public.csr_sections,
  public.impact_categories,
  public.brand_identity,
  public.digital_presence,
  public.translations,
  public.company_info,
  public.services,
  public.leadership
to anon, authenticated;

grant all on
  public.projects,
  public.portfolio_items,
  public.corporate_services,
  public.project_media,
  public.sponsors,
  public.partners,
  public.partnerships,
  public.future_vision_phases,
  public.csr_sections,
  public.impact_categories,
  public.brand_identity,
  public.digital_presence,
  public.translations,
  public.company_info,
  public.services,
  public.leadership
to service_role;

-- Make the migration-017 audit_logs_admin_read policy effective: migration 015
-- ran `revoke all ... from anon, authenticated`, which also dropped the SELECT
-- grant. Re-grant SELECT for authenticated so admins reading the audit trail
-- through a user-scoped client can use the policy.
grant select on public.audit_logs to authenticated;

-- ============================================================
-- 5. Reduce unnecessary privilege surface on role-management RPCs
-- ============================================================
-- anon can never pass the auth.uid() check inside the functions, so its
-- EXECUTE grant (added in migration 015) is dead surface. Remove it.
revoke execute on function public.assign_user_role(uuid, uuid, uuid) from anon;
revoke execute on function public.remove_user_role(uuid, uuid, uuid) from anon;