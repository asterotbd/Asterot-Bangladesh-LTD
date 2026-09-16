// Parses the YouTube links an admin is likely to paste. Shared by the Add
// Video form and the API so both accept exactly the same inputs. Browser-safe.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be'
])

export type ParsedYoutubeUrl = { youtubeId: string; isShort: boolean }

/**
 * Accepts watch, youtu.be, shorts, embed and live links, or a bare 11-character
 * video ID. Returns null for anything else, including non-YouTube hosts.
 */
export function parseYoutubeUrl(input: string): ParsedYoutubeUrl | null {
  const value = input.trim()
  if (YOUTUBE_ID.test(value)) return { youtubeId: value, isShort: false }

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  if (!YOUTUBE_HOSTS.has(host)) return null

  const segments = url.pathname.split('/').filter(Boolean)
  let candidate: string | undefined
  let isShort = false

  if (host === 'youtu.be') {
    candidate = segments[0]
  } else if (segments[0] === 'watch') {
    candidate = url.searchParams.get('v') ?? undefined
  } else if (['shorts', 'embed', 'live', 'v'].includes(segments[0])) {
    candidate = segments[1]
    isShort = segments[0] === 'shorts'
  }

  return candidate && YOUTUBE_ID.test(candidate) ? { youtubeId: candidate, isShort } : null
}

export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`
export const youtubeThumbnailUrl = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`
