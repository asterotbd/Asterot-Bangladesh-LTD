import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { jsonError } from '../../../../../lib/api-utils'
import { findVideoByYoutubeId } from '../../../../../lib/videos-server'
import { parseYoutubeUrl, youtubeWatchUrl } from '../../../../../lib/youtubeUrl'

export const dynamic = 'force-dynamic'

// Prefills the Add Video form from a pasted link using YouTube's public oEmbed
// endpoint, which needs no API key. The outbound URL is always YouTube's with
// a validated 11-character ID, so the endpoint cannot be used to fetch
// arbitrary addresses.
export async function GET(request: Request) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)

  const parsed = parseYoutubeUrl(new URL(request.url).searchParams.get('url') ?? '')
  if (!parsed) return jsonError('Enter a valid YouTube video link.', 400)

  const alreadyAdded = Boolean(await findVideoByYoutubeId(parsed.youtubeId).catch(() => null))

  let title: string | null = null
  let found = false
  try {
    const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeWatchUrl(parsed.youtubeId))}`
    const res = await fetch(oembed, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = (await res.json()) as { title?: unknown }
      title = typeof data.title === 'string' ? data.title : null
      found = true
    }
  } catch {
    // Timeouts and network errors just mean no prefill; the admin can still
    // type the title and add the video.
  }

  // oEmbed answers 401 for videos with embedding disabled and 404 for private
  // or removed ones; neither is fatal, the form only warns.
  return NextResponse.json({ youtubeId: parsed.youtubeId, isShort: parsed.isShort, title, found, alreadyAdded })
}
