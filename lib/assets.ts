// Resolves site media to its public Cloudflare R2 URL.
//
// Local paths stay in the source as "/media/..." and are rewritten here at
// render time rather than being hardcoded to absolute R2 URLs. That keeps two
// properties worth having:
//
//   - Call sites stay host-agnostic: switching bucket or CDN domain is a
//     single environment variable, not a code change. Note that the local
//     copies under public/media and public/images have been removed now that
//     R2 serves them, so an unset NEXT_PUBLIC_R2_PUBLIC_URL yields paths that
//     404. next.config.js fails a production build when it is missing.
//   - Values that are already absolute (Supabase storage URLs written by the
//     admin uploader, YouTube thumbnails) pass through untouched, so the same
//     helper is safe to apply to database-sourced URLs.

const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '')

/** True when media should be served from R2 rather than public/. */
export const usingR2 = R2_BASE.length > 0

/**
 * Maps a root-relative media path to its public URL.
 *
 * Absolute URLs, protocol-relative URLs and data/blob URIs are returned as-is.
 */
export function asset(src: string): string
export function asset(src: string | null | undefined): string | null
export function asset(src: string | null | undefined): string | null {
  if (!src) return null
  if (!R2_BASE) return src
  // Anything already carrying a scheme or host is not ours to rewrite.
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return src
  if (!src.startsWith('/')) return src
  return `${R2_BASE}${src}`
}

export default asset
