# Asterot CMS — Part 4 Audit Report

Scope: Security, Admin UI quality, Public regression & performance audit of the Asterot CMS admin system.
No commits, pushes, or deployments were made as part of this part. No public website redesign was done, and the "Spotlight — A Story of Growth" media section was not modified.

## 1. Admin Security Audit

### Findings (code)
All 26 `/api/admin/*` route handlers were reviewed. Every route follows the same hardened chain and no authorization or validation gaps were found in route code:

1. `requireApiPermission(...)` — resolves roles server-side via the service-role client (`lib/auth.ts`); the browser client (`supabaseBrowser.tsx`) is auth-only and never used for data reads.
2. `verifyCsrfRequest(request)` — origin/host match check on every mutating route (`lib/csrf.ts`).
3. `isRateLimited(...)` — DB-backed rate limiting via `rate_limit_consume` RPC restricted to service_role (`lib/rate-limit.ts`).
4. UUID validation on all `:id` params and full payload validation via `lib/api-validation.ts`.

### Critical finding: RLS disabled on 17 tables (fixed)
The biggest issue was not in route code but in the database. RLS was disabled on 17 content tables, meaning anyone holding the public publishable key could read **and write** these tables directly through the Supabase REST API, bypassing the admin auth/permission layer entirely. This applied to:

- `projects`, `portfolio_items`, `company_info`, `services`, `leadership`, `partnerships` (write on `projects`/`portfolio_items` was possible despite some read-only policy intent)
- `corporate_services`, `project_media`, `sponsors`, `partners`, `future_vision_phases`, `csr_sections`, `impact_categories`, `brand_identity`, `digital_presence`
- `translations` (write access)
- `site_settings` (write access)

Public pages were verified to read exclusively through the service-role admin client, so enabling RLS does not break the site.

**Fix:** new migration `024_enable_rls_remaining.sql` (mirrored in `db/migrations/` and `supabase/migrations/`, hashes verified identical):

- Enables RLS on all 17 tables.
- `SELECT`-only policies for `anon`/`authenticated`:
  - `published = true` gate where the column exists (`services`, `projects`, `portfolio_items`, `company_info`, `leadership`, `partnerships`, `future_vision_phases`, `csr_sections`, `impact_categories`, `brand_identity`, `digital_presence`).
  - `corporate_services` / `project_media` gated on the parent `projects.published = true`.
  - `sponsors`, `partners`, `translations`: public `SELECT true`.
- `site_settings`: RLS enabled with **no** `anon`/`authenticated` policy — not readable via the public API.
- Re-granted `SELECT on audit_logs to authenticated` (this grant was revoked in migration 015 and never re-issued, leaving the `admin_read` policy dead code).
- Revoked unnecessary `anon EXECUTE` on `assign_user_role` / `remove_user_role`.

### Other fixes
- Stored-XSS prevention in `app/api/admin/content/homepage/route.ts`: `cta_url` is now sanitized (`cleanCtaUrl`) to reject `javascript:`, `data:`, `vbscript:` schemes before saving; `image_media_id` is validated as a UUID.
- `app/api/cron/youtube-sync/route.ts`: the bearer-token comparison now uses constant-time comparison (`timingSafeEqual`) instead of `===`.

## 2. Secret Scan

Clean. No production secrets found in tracked files:

- `.env.local` is gitignored; only `.env.example` is tracked and contains placeholders only.
- No JWT (`eyJ…`), AWS, GitHub, Google, private-key, or other credential material in any tracked source file.
- `build-part3.log` and `build-part4.log`: zero JWT-shaped matches.
- `SUPABASE_SERVICE_ROLE_KEY` appears only as `process.env.SUPABASE_SERVICE_ROLE_KEY` usage.

## 3. Admin UI Quality Audit

P0/P1/P2 findings from the audit were addressed:

- **Dead "Edit" link in album cards** (`AlbumsManager`) — the link was nested inside another `<Link>`; card restructured so the actions row lives outside the link.
- **Permission mismatch: albums & videos pages vs APIs.** Pages gated on `content.*` but APIs require `media.view`/`media.manage`, so admin/editor users saw the pages but every save 403'd. Aligned nav + list + new/edit/detail page gates to `media.view` (read) / `media.manage` (mutations) in `app/admin/(shell)/layout.tsx` and the albums/videos pages. The media picker in `AdminNewsForm` now surfaces a failure state instead of an infinite "Loading…" spinner when the user lacks `media.view`.
- **DB errors masquerading as empty lists.** `getAllEvents` / `getAllNews` swallowed errors and returned `[]`, so the Events/News admin pages showed "No events yet" on database failure. Both functions now throw on error; the list pages render an `ErrorState` and the API GET routes return a 500 `jsonError` (no behavior change on success).
- **No client-side validation on Event/News forms.** Added required-title checks (with inline error), `required` attributes, and capacity validation (non-negative integer) in `AdminEventForm` / `AdminNewsForm`.
- **MediaGrid edit dialog dropped Bengali fields.** `alt_bn` and `caption_bn` inputs added (values were already being sent but were uneditable).
- **No success confirmation on status/delete actions.**
  - `ContactMessageActions`: success/error feedback with distinct styling.
  - Delete actions in `SettingsForm`, `CapabilitiesForm`, `CategoriesForm`, `FaqForm`, `AboutForm` now show success feedback.
  - `AdminCompanyForm`: added required company-name validation and a "Saved successfully." confirmation.
- **ConfirmDialog** now closes on Escape (focus trap still pending).
- **Album photo controls were hover-only** (unusable on touch). Controls are now always visible and the move buttons got `aria-label`s.
- **Dashboard contact metrics** loaded sequentially; now fetched in parallel with `Promise.all`.
- **Empty states** for capabilities, categories, FAQ, and homepage now render the create form (instead of a blank list).

Not addressed this part (documented for Part 5): search/filter/pagination on Events & News admin lists (the data is loaded fully in memory), focus-trap/keyboard nav in dialogs, and a proper paginated albums admin table.

## 4. Public Website Regression (code inspection)

No live server is available in this environment, so regression is code-based against the last commit.

- **Homepage visual unchanged** — same sections/order: Hero → Companies marquee → Featured event → BangladeshReach → Capabilities grid + event categories → FAQ preview → partner CTA. Capabilities/services are now CMS-driven with identical fallbacks when the DB is empty.
- **Spotlight "A Story of Growth"** (`app/media/photos/page.tsx`) — untouched.
- **Removed sections still absent** — the homepage contains neither "About Asterot" nor "News & Announcements" sections.
- **Media & navigation intact** — nav links to `/media/photos` and `/media/videos`; photo album list/detail pages intact.
- **SEO** — canonical `https://www.asterot.com/` on the homepage and `https://www.asterot.com/media/photos` on the gallery; `sitemap.xml` and `robots.txt` present.
- All Part 4 changes are confined to `app/admin/**`, `app/api/admin/**`, `app/api/cron/**`, `components/admin/**`, admin form components, and admin-only helpers in `lib/` (`getAllEvents`/`getAllNews`). No public-facing rendering component was changed in this part.

## 5. Performance Audit

- **`getPublishedAlbums` (public photos gallery) had a severe N+1**: per album it ran one query for photos plus one query per photo for its public URL — up to N×(1+M) round trips. Rewritten to **3 total queries** (albums, then `album_photos` batched by `album_id`, then `media` public URLs batched by `id`), with in-memory assembly.
- **Admin `listAlbums`** fetched cover URLs one query per album; now a single batched `media` query.
- **Public album detail page** fetched one media query per photo and loaded the album twice per request (`generateMetadata` + page). Now a single batched media query and `React.cache()` memoization so the album+photos load once per request.
- **Dashboard** contact metrics parallelized.
- **DB indexes** (`025_performance_indexes.sql`): `user_roles(user_id)`, `user_roles(role_id)`, `events(status)`, `events(featured)`, `events(category_id)`, `news(status)`, `news(category_id)`, `media(created_at desc)`, `audit_logs(created_at desc)`, `audit_logs(actor_id)`, `audit_logs(action)`, `registrations(event_id)`, `registrations(user_id)`.
- Verified no other N+1 in the server libs: user/role/auth batching already uses `.in()` + `Promise.allSettled`; remaining loops are in-memory aggregation over single queries.
- Known minor: `reorderAlbumPhotos` issues one UPDATE per photo (only on explicit reorder action; acceptable).

## 6. Final Verification

- `npx tsc --noEmit` — passed, no errors.
- `npm run lint` — "No ESLint warnings or errors".
- `npm run build` — compiled successfully; 57/57 static pages generated; all admin routes, APIs, and public pages compiled; no build errors. Log: `build-part4.log`.

## 7. Files Changed

Security:
- `db/migrations/024_enable_rls_remaining.sql` + `supabase/migrations/024_enable_rls_remaining.sql` (new)
- `db/migrations/025_performance_indexes.sql` + `supabase/migrations/025_performance_indexes.sql` (new)
- `app/api/admin/content/homepage/route.ts`
- `app/api/cron/youtube-sync/route.ts`

Admin UI:
- `app/admin/(shell)/layout.tsx`
- `app/admin/(shell)/media/albums/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`
- `app/admin/(shell)/media/videos/page.tsx`
- `app/admin/(shell)/events/page.tsx`, `app/admin/(shell)/news/page.tsx`
- `app/api/admin/events/route.ts`, `app/api/admin/news/route.ts`
- `components/admin/AlbumsManager.tsx`, `AdminEventsTable.tsx`, `AdminNewsTable.tsx`, `AdminShell.tsx`, `AlbumEditor.tsx`, `ConfirmDialog.tsx`, `MediaGrid.tsx`, `ContactMessageActions.tsx`, `SettingsForm.tsx`, `CapabilitiesForm.tsx`, `CategoriesForm.tsx`, `FaqForm.tsx`, `AboutForm.tsx`
- `components/AdminNewsForm.tsx`, `components/AdminEventForm.tsx`, `components/AdminCompanyForm.tsx`
- `lib/events-server.ts`, `lib/news-server.ts`

Performance:
- `lib/albums-server.ts`
- `app/media/photos/[slug]/page.tsx`
- `app/admin/(shell)/page.tsx`

## 8. Database Changes

Apply via Supabase (in order): `024_enable_rls_remaining.sql` (critical — RLS + grant + revoke), then `025_performance_indexes.sql`. Both files exist in both `db/migrations/` and `supabase/migrations/` and are byte-identical.

## 9. Remaining Work for Part 5

- Apply migrations 024 and 025 to the hosted Supabase project and re-verify the public site + admin flows against the live database.
- Optional UI polish: search/filter/pagination for Events & News admin lists, dialog focus trap + keyboard navigation, paginated albums table.
- Live (served) regression pass over the homepage, media gallery, and admin save flows — the code-level checks in this part passed, but end-to-end verification requires the running app with the migrated DB.