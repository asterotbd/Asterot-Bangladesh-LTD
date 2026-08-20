# Admin Panel Performance — Optimization Report

Implements the optimizations identified in `PART5_PERF_DIAGNOSIS_REPORT.md` (the 267.7 MB of full-resolution
images, ~10 serial auth round-trips per navigation, N+1 GoTrue lookups, and the Album editor client re-fetch).
Live admin re-measurement is pending manual verification by the owner; request counts below are the expected
values derived from the code changes and the measured baseline.

Committed as `a41db4d` (`perf(admin): cache auth lookups, lazy-load images, paginate lists, batch GoTrue reads`).
`npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass. Public pages verified against the production
build: `/`, `/media/photos`, `/events`, `/news`, `/media/photos/tournament` all return 200; `/admin` and
`/admin/news` redirect (307) to `/admin/login` when unauthenticated.

---

## 1. Images (biggest win)

**Before:** `AlbumsManager`, `MediaGrid`, `AlbumEditor` (grid + picker) rendered raw 3.1 MB-average originals via
`<img>` — 267.7 MB of assets, up to 23.7 MB each, no resizing and no lazy loading.

**After:**
- `components/admin/AlbumsManager.tsx`, `MediaGrid.tsx`, `VideosManager.tsx`, `AlbumEditor.tsx` now use
  `next/image` with `fill`, `loading="lazy"`, and explicit `sizes` — the optimizer generates device-appropriate
  thumbnails on the fly instead of shipping originals.
- `next.config.js` `images.remotePatterns` adds `*.supabase.co` so storage-hosted uploads work with the optimizer.
  Originals are untouched; no thumbnail/resize pipeline was introduced.
- Album picker reduced from `perPage=100` to `perPage=24` with a "Load more" button.

Net effect: grid/album pages now download only the pixels the UI actually displays, a reduction of roughly
2–3 orders of magnitude on payload for typical viewport sizes.

## 2. Auth / request chain

**Before:** ~8 sequential auth round-trips per admin page (middleware `getUser` + layout getUser/roles/profile +
page getUser/roles), `getUserRoles` = 2 queries run 2–4× per render, middleware `getUser` on `/api/*` too.

**After:**
- `lib/auth.ts`: `getCurrentUser`, `getCurrentProfile`, `getUserRoles`, `getUserPermissions` are wrapped in
  `React.cache` — each runs once per request regardless of how many layouts/pages/helpers call it.
- `getUserRoles` collapsed from 2 sequential queries to a single embedded `roles(name)` query.
- All 30 admin pages + layout + dashboard now use the cached helpers (no duplicate `createServerClient` + `getUser`).
- `middleware.ts` skips session refresh for `/api/*` — those routes already authorize via `requireApiPermission`.
- `requireApiPermission` now shares the cached `getCurrentUser`/`getUserRoles` instead of repeating the chain.

Expected per-page auth cost: **8 → ~4 round-trips** (MW getUser + shared getUser + shared roles + shared profile),
and `getUserRoles` runs 1 query not 2.

## 3. Album editor — no more client re-fetch

**Before:** `AlbumEditor.loadPhotoUrls()` called `GET /api/admin/media?perPage=100` on mount (+6 requests), and
opening the picker re-fetched the same 100-item endpoint (+6 more) → ~22 requests for one album page.

**After:**
- `app/admin/(shell)/media/albums/[id]/page.tsx` fetches photo URLs server-side in one query via new
  `listMediaPublicUrls()` (`lib/albums-server.ts`) and passes them to `AlbumEditor`.
- The client `loadPhotoUrls` fetch and its `useEffect` are gone; the picker fetches only on open, paginated (24/page,
  "Load more").

Expected: album detail page ≈ **7 server requests** (auth 4 + getAlbum + listAlbumPhotos + photo URLs) with **no**
client re-fetch on load.

## 4. Batch GoTrue reads (N+1)

**Before:** `getAuthInfoForUserIds` (`lib/users-server.ts`) and `resolveActorEmails` (`lib/activity-server.ts`)
issued one `auth.admin.getUserById` per row — up to 20 GoTrue round-trips per page (parallel but rate-limited).

**After:** both now run a single `auth.users` query with `.in('id', ids)` against the auth schema
(`getAuthAdminSupabase`), reading only non-secret columns (email, email_confirmed_at, last_sign_in_at).

Expected: Users ≈ 31 → **8 requests**; Activity ≈ 9–29 → **6 requests**.

## 5. News / Events list pagination

**Before:** `news/page.tsx` and `events/page.tsx` loaded full tables including `content_en/content_bn` with no
pagination.

**After:**
- New `listNews` / `listEvents` in `lib/news-server.ts` / `lib/events-server.ts` use a lighter list field set,
  `count: 'exact'`, and `range` paging (20/page).
- Both pages render `Pagination` and a "Showing X of Y" line. `getAllNews`/`getAllEvents` remain for the dashboard.

Expected: News and Events ≈ **5 requests** each, and the row payload no longer includes article bodies.

---

## Request-count summary (expected, vs measured baseline)

| Page | Before | After |
|---|---|---|
| Dashboard | ~26 | ~22 (auth 8→4; data queries unchanged) |
| Media Library | ~10 | ~6 (+ lazy thumbnails) |
| Photo Albums list | ~10 | ~6 (+ lazy cover thumbnails) |
| Album detail | ~22 | ~7, no client re-fetch, picker 24/page |
| Messages | ~9 | ~5 |
| News | ~9 | ~5 (paginated, lighter rows) |
| Events | ~9 | ~5 (paginated, lighter rows) |
| Users | ~31 | ~8 (1 batched auth query) |
| Activity | 9–29 | ~6 (1 batched auth query) |
| Single mutation (e.g. publish toggle) | ~15 | ~10 (API no longer pays middleware getUser; page refresh shares cached auth) |

## Remaining bottlenecks (out of scope / future work)

- **Dashboard aggregates** still read full tables (`getAllEvents`, `getAllNews`, `getUserCountsByRole`,
  `getRegistrationCountsByStatus`) to count — fine at current volumes, would benefit from DB-side `count`/grouping.
- **`router.refresh()` after mutations** still re-renders the full page (~page-auth + data). Targeted invalidation or
  optimistic updates would remove this.
- **Album reorder** (`reorderAlbumPhotos`) still performs 1 UPDATE per photo sequentially (73 for a full album);
  add-photos is N sequential inserts. A bulk upsert would collapse these into 1–2 queries.
- **`listMedia` news-featured exclusion** is an extra query on every media call.
- **Original images remain full-res** in `public/media/photos` (267.7 MB). A resize-on-upload + thumbnail column
  pipeline (public storage, RLS) is the next-tier improvement but was intentionally left untouched.

## Verification status

- `npx tsc --noEmit` — pass
- `npm run lint` — pass
- `npm run build` — pass (admin routes 87.9–104 kB First Load JS)
- Public pages (production build, `localhost:3000`) — `/`, `/media/photos`, `/events`, `/news`,
  `/media/photos/tournament` all 200; unauthenticated `/admin` → 307 `/admin/login`
- Live admin behavior + re-measurement — **pending manual verification** (owner testing on `localhost:3000`)