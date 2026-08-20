import { timingSafeEqual } from 'node:crypto'
import { syncYoutubeVideos } from '../../../../lib/youtube'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Operator-only, server-to-server cron endpoint (invoked by GitHub Actions
// with CRON_SECRET). Detailed error messages are intentionally retained in the
// response so the operator can diagnose sync failures; this route is never
// called from the browser and is not part of the browser-facing API surface.

function secureEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')
  const allowed = secret
    ? authorization !== null && secureEqual(authorization, `Bearer ${secret}`)
    : false

  if (!allowed) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    )
  }

  try {
    const result = await syncYoutubeVideos()
    return new Response(
      JSON.stringify({ ok: true, ...result }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (err) {
    console.error('[youtube-sync] sync failed:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}