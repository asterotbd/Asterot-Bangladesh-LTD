# Asterot CMS — Pending Migrations Applied to Hosted Supabase (020–025)

Scope: apply the pending migrations to the connected hosted Supabase project, verify the resulting database state and security behavior, and confirm the codebase still builds. No data was deleted or reset. No roles or users were modified. No commits, pushes, or deployments were made.

---

## STATUS

**PASS** — all six pending migrations (020–025) applied cleanly to the hosted project; every verification query and functional security test passed; `tsc`, `lint`, and `build` all pass.

---

## 1. PROJECT TARGETED

- CLI linked project (`supabase/.temp/linked-project.json`): **"Asterot's Website"**, ref `xkqdzsxsebxtcbbvkxjt`, org `qjwzfryfwprecpfbjunc`.
- `.env.local` `NEXT_PUBLIC_SUPABASE_URL` = `https://xkqdzsxsebxtcbbvkxjt.supabase.co` — matches.
- DB identity probe confirmed the Asterot CMS schema (albums, album_photos, faq, homepage_sections, media, events, news, site_settings, audit_logs, roles, user_roles, …) on that project. Target confirmed before anything was applied.
- Pre-apply `supabase migration list`: remote had 001–019; 020–025 pending. User authorized applying all pending 020–025 in order.

## 2. MIGRATION 024 (`enable_rls_remaining`) — APPLIED, VERIFIED

- Applied successfully (recorded in `supabase_migrations.schema_migrations` as `024`).
- RLS enabled on all 17 remaining tables (verified via `pg_class.relrowsecurity`): brand_identity, company_info, corporate_services, csr_sections, digital_presence, future_vision_phases, impact_categories, partners, partnerships, portfolio_items, project_media, projects, services, sponsors, translations (plus site_settings), on top of news/events/media/categories/leadership already covered.
- RLS policies present (verified via `pg_policies`): every public content table has exactly a `*_public_read` (SELECT for `anon,authenticated`) + `*_admin_all` (ALL for `service_role`) pair; news/events/media/categories additionally have `*_authenticated_manage` (ALL for `authenticated`).
- `site_settings`: RLS enabled, **0 policies** (no anon/authenticated read path), and the earlier functional test returned 401 for anon reads — settings are server-only.
- `audit_logs`: `authenticated` granted **SELECT only**; `anon` has **no grants** (verified via `role_table_grants`); `postgres`/`service_role` keep full access.
- RPC hardening: `anon` **cannot EXECUTE** `assign_user_role`/`remove_user_role`; `authenticated` can (verified via `has_function_privilege`).
- Functional anon-key test (publishable key, REST): anon reads on projects/services/news/media/leadership return **published rows only**; anon INSERT to projects and news → `401 42501 row-level security policy violation`; anon SELECT site_settings/audit_logs → `401 permission denied`. RLS is enforced end-to-end.

## 3. MIGRATION 025 (`performance_indexes`) — APPLIED, VERIFIED

- Applied successfully (recorded as `025`).
- All 14 indexes confirmed present in `pg_indexes`: `idx_user_roles_user`, `idx_user_roles_role`, `idx_events_status`, `idx_events_featured`, `idx_events_category`, `idx_news_status`, `idx_news_category`, `idx_media_created_at`, `idx_audit_logs_created_at`, `idx_audit_logs_actor`, `idx_audit_logs_action`, `idx_registrations_event`, `idx_registrations_user`, `idx_leadership_published`.

## 4. RLS

See items 2. RLS is enabled on all 21 content/system tables with a strict read/published + service_role admin policy matrix; anon write paths are rejected at the database level (verified functionally), and anon reads are filtered to published rows.

## 5. INDEXES

See item 3. All 14 performance indexes exist (no duplicates, no errors during apply).

## 6. ROLES / USER_ROLES — UNCHANGED

- Role set intact (verified via SQL): `admin`, `coach`, `editor`, `finance`, `super_admin`.
- Assignment counts: `super_admin` = 1, `admin` = 1, others = 0.
- Full assignment detail (verified via SQL join against `auth.users`):
  - `c17a04be-e3cf-4a60-87b8-721fbf4f7fc5` — jakyallnaiem@gmail.com — **super_admin**
  - `13a2c1e6-5ff6-43f1-848a-fc64d29c8b1a` — mdfaysalmahmud3@gmail.com — **admin**
- No migrations touched `roles` or `user_roles`; no rows changed.

## 7. SUPER ADMIN

- Exactly **1** `super_admin` assignment exists (c17a04be… / Jaky All Naiem Jihan, self-assigned).
- **Factual finding (no change made):** the application-level `PROTECTED_SUPER_ADMIN_ID` (`13a2c1e6-5ff6-43f1-848a-fc64d29c8b1a`, Md Faysal Mahmud) currently holds the **`admin`** role in the database, not `super_admin`. The account exists and is intact; the constant protects it from demotion below admin, but per the DB it is already below super_admin. Flagging so the owner can decide whether to re-grant `super_admin` — the codebase will refuse to assign it via the UI because `PROTECTED_SUPER_ADMIN_ID` cannot be demoted, and it is not blocked from being elevated. This is a data-state observation, not an error in this task.
- The `user_roles_protect_last_super_admin` trigger (migration 022) is present on `user_roles` (verified via `pg_trigger`), guaranteeing the last `super_admin` assignment can never be removed by any path.

## 8. TYPESCRIPT

`npx tsc --noEmit` → **exit 0, no errors**.

## 9. LINT

`npm run lint` → **exit 0, "No ESLint warnings or errors"**.

## 10. BUILD

`npm run build` → **exit 0** (all routes compiled; 57 pages, static + dynamic as before).

## 11. ERRORS / REMAINING BLOCKERS

- **Pre-apply blocker (fixed):** migration 020 contained `create policy if not exists "public-media public read" …`, which PostgreSQL does not support (syntax error 42601) — the first `db push` aborted cleanly before applying anything (confirmed via `migration list`: remote still 001–019). Fixed in **both** `db/migrations/020_storage_hardening.sql` and `supabase/migrations/020_storage_hardening.sql` (hashes verified identical) by switching to `drop policy if exists … ; create policy … ;`. Re-push applied all six migrations.
- Storage verification (item 2 addendum): after 020, the **only** anon/authenticated policy on `storage.objects` is `public-media public read` (SELECT) — all anon/authenticated write policies were dropped. Bucket `public-media` remains public so existing image URLs keep working.
- No remaining blockers. Recommended (optional, out of scope of this task): interactive click-through of the running admin against the live DB, and the owner's decision on the `13a2c1e6…` role state noted in item 7.

---

*Nothing was committed, pushed, or deployed. `.env.local` credentials were never printed.*
