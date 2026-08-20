# Admin Panel Performance — Diagnosis Report

Investigation only. **No code was modified.** Measurements taken against the linked Supabase project
(ref `xkqdzsxsebxtcbbvkxjt`, ap-southeast-1) and the local Next.js build.

## Headline finding

The database is tiny (see Data volumes) — the slowness is **not** caused by row counts. It is caused by:

1. **Hundreds of MB of full-resolution images** being served raw to the admin UI.
2. **~10 sequential network round-trips** of authentication/permission work per page load, re-executed on every navigation because nothing is cached and every page is `force-dynamic`.
3. **N+1 requests to the GoTrue admin API** (one `getUserById` per row) on Users and Activity pages.
4. **Client-side re-fetching** of the whole media library on the Album editor page.

Every request travels from the serverless function to Supabase (auth GoTrue + PostgREST). At ~150–400 ms per round trip, a page that makes 10–30 requests can take multiple seconds regardless of data size.

---

## Data volumes (measured, live DB)

| Table | Rows | | Table | Rows |
|---|---|---|---|---|
| albums | 9 | | profiles | 4 |
| album_photos | 73 | | user_roles | 2 |
| media | 84 | | contact_messages | 2 |
| news | 5 | | audit_logs | 6 |
| events | 1 | | site_settings | 0 |
| registrations | 0 | | categories | 2 |

News body sizes: max ~1.1 KB content_en — small today.

### Image payload (critical)
`public/media/photos/` (git-tracked, served as static originals):
- **88 files, 267.7 MB total**, average **3.1 MB**, largest **23.7 MB**.
- No `next/image`, no thumbnails, no resize pipeline. Admin `<img>` tags point at these originals.

---

## Fixed cost per request (the shell + auth)

- `middleware.ts:28` calls `supabase.auth.getUser()` on **every** matched request — pages **and** `/api/*` (matcher excludes only static assets). = 1 GoTrue round trip per request.
- `lib/auth.ts getUserRoles()` = **2 sequential Postgres queries** (`user_roles`, then `roles`).
- `requireApiPermission()` (every API route) = `getUser()` + 2 role queries = **3 requests**.
- Server layout (`app/admin/(shell)/layout.tsx`) runs per navigation: `getUser()` + `getUserRoles()` (2) + profile query = **4 requests** — then **every page repeats** `getUser()` + `getUserRoles()` via `requireAnyPermission`/`requirePermission`.

So the **fixed overhead per admin page load is ~8 sequential round trips** (~2–3 s at typical latency) before any page data is fetched. `getUserRoles` is executed 2–4 times per render (layout + page), each time as 2 queries.

---

## Per-operation request counts

Auth overhead abbreviations: **MW** = middleware `getUser` (1), **L** = layout (4: getUser + 2 role + profile), **P** = page auth (`getUser` + `requireAnyPermission`→2 role queries = 3).

### Admin Dashboard (`app/admin/(shell)/page.tsx`)
| Step | Query | Requests | Parallel? |
|---|---|---|---|
| MW + L + P | auth/permission | 8 | mostly sequential |
| — | duplicate `getUserRoles` (page) | 2 | sequential |
| — | duplicate profile query (page) | 1 | — |
| events | `getAllEvents()` (full table) | 1 | — |
| registrations | total + by-status + recent | 3 | parallel |
| news | `getAllNews()` (full table, incl. content) | 1 | — |
| users | `getTotalUserCount` + `getUserCountsByRole` (full `user_roles`) | 2 | parallel |
| company | `getCompanySnapshot` | 1 | — |
| contact | 2× `listContactMessages` (perPage 1) | 2 | parallel |
| media | `listMedia` (news-featured + media) | 2 | sequential |
| activity | `listAuditLogs` (perPage 1) | 1 | — |
| settings | `listSettings` | 1 | — |
| **Total** | | **≈ 26** | ~10 sequential, rest partly parallel |

### Admin → Media Library (`app/admin/(shell)/media/page.tsx`)
- MW + L + P = 8, `listMedia` = 2 (news-featured exclusion + items) → **~10 requests**.
- Renders up to **24 full-size originals** (~75 MB of images on page 1).

### Admin → Photo Albums list (`media/albums/page.tsx`)
- MW + L + P = 8, `listAlbums` = 2 (albums + cover media) → **~10 requests**.
- `listAlbums` embeds `album_photos(id)` to count photos — pulls every photo id for the page's albums (up to 24×N rows of ids). **Necessary record loading**: returns all photo ids just to display a count.
- Renders covers at **full resolution**.

### Admin → Album detail (`media/albums/[id]/page.tsx` + `AlbumEditor`)
- MW + L + P = 8, `getAlbum` + `listAlbumPhotos` = 2 (parallel) → **~10 server requests**.
- **Client re-fetch**: `AlbumEditor.loadPhotoUrls()` calls `GET /api/admin/media?perPage=100&type=photo` on mount → that API = MW(1) + `requireApiPermission`(3) + `listMedia`(2) = **+6 requests** = **~16 total**.
- Opening the picker re-fetches the same 100-item endpoint again (**+6 more**).
- Photo grid + picker render up to **100 full-size images** (~300 MB worst case).

### Admin → Messages (`messages/page.tsx`)
- MW + L + P = 8, `listContactMessages` = 1 → **~9 requests**. Paginated (20/page). Efficient.

### Admin → News (`news/page.tsx`)
- MW + L + P = 8, `getAllNews()` = 1 → **~9 requests**. **No pagination** — fetches every article including full `content_en/content_bn`.

### Admin → Users (`users/page.tsx`)
- MW + L + P = 8, `listRoles` = 1, `listUsers` = profiles(1) + roles(1) + **N GoTrue admin `getUserById`** (20/page) → **~31 requests** for 20 users. The 20 auth lookups are parallel but each is a full GoTrue round trip and GoTrue admin endpoints are rate-limited.

### Admin → Activity (`activity/page.tsx`)
- MW + L + P = 8, `listAuditLogs` = 1 + **N GoTrue admin `getUserById`** (up to 20/page) → **9–29 requests**.

### Album detail server + client re-fetch summary
Server ~10 + AlbumEditor fetch 6 + picker 6 ≈ **~22 requests** and up to **100 full-size images** to render one album page.

---

## Mutations (each is expensive)

A single action (e.g. message status change, news publish toggle):
1. Client `fetch` → API route: MW(1) + `requireApiPermission`(3) + rate-limit RPC(1) + mutation(1) + audit insert(1) = **6 requests**.
2. `router.refresh()` → **full page re-render** = MW(1) + L(4) + P(3) + page data ≈ **9 more requests**.

**Total ≈ 15 requests per single mutation.**

Worst mutation — **album reorder** (`lib/albums-server.ts reorderAlbumPhotos`): 1 UPDATE per photo, **sequential** = N round trips (73 for a full album). **Add photos** = getAlbum + listAlbumPhotos + N sequential inserts.

---

## Server components vs client, caching, bundle

- **Bundle size is fine.** Measured from a fresh `npm run build`: admin routes 88–99 kB First Load JS (shared chunks). `/admin/login` is the largest at 161 kB. No large-client-component issue.
- All admin pages are `export const dynamic = 'force-dynamic'` — **no route caching, no ISR, no revalidate**. Every navigation re-runs every query.
- Admin is server-component driven; client components only handle actions and fetch via API routes (good — no supabase tokens in the browser).
- `router.refresh()` after every mutation discards the RSC cache and re-runs the whole page.

---

## Dev vs production

- Structurally identical: dev adds slow HMR/compile and unminified JS, so admin feels worse in dev, but **the request-count and image problems exist in production equally**.
- In production the biggest real-world lag is the serial auth chain + full-size image downloads; both are present in both modes.

---

## Ranked findings

### Critical bottlenecks
1. **Full-resolution images in admin** — `AlbumsManager`, `MediaGrid`, `AlbumEditor` (grid + picker) render raw originals via `<img>`; 267.7 MB of assets, avg 3.1 MB, up to 23.7 MB each; no `next/image`, no thumbnails, no resize, no lazy loading on covers/picker. This alone can make album/media pages take tens of seconds.
   Files: `components/admin/AlbumsManager.tsx:60`, `components/admin/MediaGrid.tsx:99`, `components/admin/AlbumEditor.tsx:206,247`.
2. **Serial auth/permission chain per navigation (~8 round trips, uncached)** — middleware `getUser` on every request; layout + every page each call `getUser` + `getUserRoles`; `getUserRoles` = 2 queries and runs 2–4×/render.
   Files: `middleware.ts:28`, `app/admin/(shell)/layout.tsx:36-54`, `lib/auth.ts:12-83`, every admin page.
3. **Album editor client re-fetch of the whole library** — `loadPhotoUrls()` + picker each pull `/api/admin/media?perPage=100&type=photo` (up to 100 records, full rows) on top of the server-rendered data.
   Files: `components/admin/AlbumEditor.tsx:20-55`.

### Medium bottlenecks
4. **N+1 GoTrue admin lookups** — `getAuthInfoForUserIds` (`lib/users-server.ts:260`) and `resolveActorEmails` (`lib/activity-server.ts:94`) issue one `auth.admin.getUserById` per user per page (20/page). Parallel but high-latency and rate-limited.
5. **No pagination on News/Events admin lists + dashboard aggregates** — `getAllNews`/`getAllEvents` fetch full tables incl. content; dashboard re-reads entire tables just to count.
   Files: `lib/news-server.ts:127`, `lib/events-server.ts:81`, `app/admin/(shell)/news/page.tsx:19`, `app/admin/(shell)/events/page.tsx:19`, `app/admin/(shell)/page.tsx`.
6. **Sequential write loops** — album reorder = 1 UPDATE/photo (73 RTs); add-photos = N inserts. Files: `lib/albums-server.ts:190-199`, `app/api/admin/albums/[id]/photos/route.ts:49-64`.
7. **`router.refresh()` full re-render after every mutation** (~9 more requests each) across all client managers.

### Minor bottlenecks
8. **`listMedia` news-featured exclusion = extra query on every call** (dashboard, media page, media API ×2) — `lib/media-server.ts:115-126`.
9. **`getUserCountsByRole` / `getRegistrationCountsByStatus`** fetch full tables to count — fine at 2/0 rows, will degrade. `lib/users-server.ts:47`, `lib/registrations-server.ts:29`.
10. **`listAlbums` embeds all `album_photos(id)`** to compute a count — returns every photo id for the page's albums. `lib/albums-server.ts:54`.
11. Admin `<img>`s lack width/height → layout shift.

### Already performant
- Server-side pagination + `range` limits on media, albums, messages, videos, users.
- `getPublishedAlbums` (public) = 3 queries, no N+1 (`lib/albums-server.ts:203`).
- Small client bundle (88–99 kB admin First Load JS).
- No Supabase tokens / service-role exposure to the browser; all admin reads via server components, writes via authenticated API routes.
- CSRF + DB rate limiting + audit are correct and cheap per call.

---

## Recommended optimizations (for approval — none applied)

1. **Images (biggest win):** generate resized thumbnails (or resize-on-upload + a thumbnail variant column/URL); use `next/image` with `loading="lazy"` and explicit dimensions in all admin grids; paginate/limit the album picker.
2. **Auth:** memoize `getUser`/`getUserRoles` per request (e.g. `React.cache`); collapse `getUserRoles` into a single query via embedded `roles(name)`; stop calling `getUser` in middleware for `/api/*` (routes already authorize).
3. **Album editor:** pass photo URLs from the server render; fetch the picker only on open and paginate it.
4. **Batch GoTrue reads:** replace N `getUserById` with one `auth.users` query (`in`) or rely on `profiles` when present.
5. **Paginate** News/Events admin lists and replace full-table dashboard aggregates with `count` queries / DB-side grouping.
6. **Bulk writes** for reorder/add-photos.
7. **Avoid full-page refresh after mutations** where cheap (targeted invalidation or optimistic updates).