// Supabase queries run through the global fetch, which Next.js patches with
// its Data Cache. supabase-js never sets a cache mode, so Next decides per
// request, and in practice it stored database responses with a one-year
// revalidate: deleting a photo in the admin left the public album page still
// rendering the pre-delete rows, even on routes marked force-dynamic.
//
// Database reads must always be live, so every server-side Supabase client
// opts out explicitly here instead of depending on each route's segment
// config. `no-store` also means a stale entry already in the cache is never
// read back, so no purge is needed after deploying this.
export const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' })
