import { syncYoutubeVideos } from '../../../../lib/youtube'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const authorization = request.headers.get('authorization')
  const allowed = secret
    ? authorization === `Bearer ${secret}`
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