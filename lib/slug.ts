// URL slugs. Browser-safe, so a form can preview exactly the slug the API will
// store: both sides run the same function.

export const MAX_SLUG_LENGTH = 200

/**
 * "Café & Friends 2025!" -> "cafe-and-friends-2025".
 *
 * Only ASCII letters and digits survive, so a title written entirely in a
 * non-Latin script (Bangla, for example) yields an empty string; callers must
 * treat that as "ask for a slug" rather than store it.
 */
export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // drop the accents NFKD split off
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slug.length <= MAX_SLUG_LENGTH) return slug
  // Cut on a word boundary instead of mid-word.
  const cut = slug.slice(0, MAX_SLUG_LENGTH)
  return cut.slice(0, cut.lastIndexOf('-')) || cut
}
