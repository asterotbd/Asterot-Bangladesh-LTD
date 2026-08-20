# Admin CMS Fixes — Report

Fixes the three Admin CMS issues. No redesign, no data deletion, no commit/push/deploy.

## Issue 1 — Photo Albums: Admin shows nothing while public gallery shows 9 albums

**Root cause:** The hosted DB `albums` table was **empty** (0 albums, 0 `album_photos`, only 11 legacy `media` rows). Public `/media/photos` calls `getPublishedAlbums()` but `PhotoAlbumsGrid` falls back to the hardcoded catalog in `lib/photoAlbums.ts` (the 9 albums the user sees) whenever the DB returns no albums. Admin → Photo Albums is DB-only (`listAlbums()`), so it correctly showed an empty list — the two surfaces read from different sources.

**Fix:** Seeded the DB with the same 9 albums via an idempotent migration (deterministic UUIDs, `on conflict (id) do nothing`): 9 albums, 73 photos, 73 `album_photos` links. Albums table was empty, so no duplicates were possible; existing media/photos untouched; slugs/routes preserved; public gallery now reads the DB through the same path as Admin.

**Files changed:**
- `db/migrations/026_seed_photo_albums.sql` (new) — seed migration
- `supabase/migrations/026_seed_photo_albums.sql` (new) — duplicate copy for `supabase db push` (SHA-256 match confirmed)

**Verification (live, hosted DB):**
- Admin query (`listAlbums` equivalent): 9 albums, all `published=true`, covers set, photo counts 21/11/9/11/10/11 (3 empty albums).
- Public gallery: 9 published albums; first album `tournament` → 21 photos, first photo `/media/photos/tournament/1.jpeg` (matches the hardcoded catalog exactly).
- Admin CRUD flows through `/api/admin/albums/*` → `albums-server.ts` → same DB the public gallery reads, so create/update/publish/delete reflect publicly.

## Issue 2 — News records appear in Media Library

**Root cause:** `news.featured_image` is a `uuid` → `media.id`. The 5 news photos (e.g. `/media/photos/news/*.jpg`, `type='photo'`) are ordinary `media` rows, so `listMedia()` returned them alongside videos and album photos.

**Fix (data-layer, not CSS):** `listMedia()` in `lib/media-server.ts` now queries `news.featured_image` ids and excludes them via `not(id, in (...))` (inserted before the search-term filter, matching the existing query-builder style).

**Files changed:**
- `lib/media-server.ts` — added news-featured-media exclusion to `listMedia()`

**Verification (live, hosted DB):**
- Media Library visible items: 79 (73 album photos + 6 YouTube videos); **0** news URLs remain visible.
- `news` table untouched: 5 rows, all `featured_image` references intact; Admin → News unaffected.

## Issue 3 — Admin → Messages: add Delete

**Fix:** Server-side delete function + authenticated API route + client UI with confirmation dialog.

**Files changed:**
- `lib/contact-server.ts` — added `deleteContactMessage(id)` (service-role delete, returns `boolean`)
- `app/api/admin/messages/[id]/route.ts` — added `DELETE` handler: `requireApiPermission('contact.manage')` → CSRF check → rate limit (`contactMutate`: prefix `contact`, max 60/10min) → UUID validation → audit `contact.delete` → 404 if not found, 500 on failure. Service role stays server-side only; nothing secret reaches the browser.
- `components/admin/ContactMessageActions.tsx` — added Delete button + `ConfirmDialog` (danger styling, busy state, cancel) + `onDeleted` callback; status-change flow unchanged
- `components/admin/MessageDetailActions.tsx` (new) — client wrapper so the server-rendered detail page can redirect after delete
- `app/admin/(shell)/messages/[id]/page.tsx` — uses `MessageDetailActions`; redirects to `/admin/messages` after delete

**Verification:**
- `npx tsc --noEmit`, `npm run lint`, `npm run build` — all pass.
- Live throwaway test through the exact service-role delete operation: insert → delete → confirmed gone (`RESULT: PASS`). Cleanup removed the test row; the 2 real `contact_messages` were untouched (count 2 before and after).

## Checks & state
- `tsc`, `lint`, `build`: **PASS**
- DB unchanged except intended seed inserts: `news` (5), `contact_messages` (2), `media` (84), `albums` (9), `album_photos` (73)
- Not committed/pushed/deployed.