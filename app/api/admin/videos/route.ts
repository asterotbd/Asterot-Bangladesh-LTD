import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { writeAuditLog } from '../../../../lib/audit'
import { listVideos, updateVideo, getVideo, findVideoByYoutubeId, createManualVideo } from '../../../../lib/videos-server'
import { getMedia } from '../../../../lib/media-server'
import { asset } from '../../../../lib/assets'
import { parseYoutubeUrl, youtubeThumbnailUrl } from '../../../../lib/youtubeUrl'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = ['caption_en', 'category', 'published']

export async function GET(request: Request) {
  const check = await requireApiPermission('media.view')
  if (!check.ok) return jsonError(check.message, check.status)

  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const search = url.searchParams.get('q') ?? ''
  const status = url.searchParams.get('status') ?? ''

  try {
    const result = await listVideos({ page: Number.isFinite(page) && page > 0 ? page : 1, perPage: 24, search, status })
    return NextResponse.json({ data: result.items, total: result.total, totalPages: result.totalPages })
  } catch (err) {
    logError('admin.videos.list', err)
    return jsonError('Unable to load videos.', 500)
  }
}

export async function PUT(request: Request) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as { id?: unknown }
  const id = raw.id
  if (typeof id !== 'string') return jsonError('Invalid video ID.', 400)

  const unknown = Object.keys(body).filter((key) => key !== 'id' && !ALLOWED_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const existing = await getVideo(id)
    if (!existing) return jsonError('Video not found.', 404)

    // Partial update, matching /api/admin/videos/[id]: absent fields are left
    // alone instead of being written as null.
    const provided = body as Record<string, unknown>
    const fields: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (!(field in provided)) continue
      const value = provided[field]
      if (field === 'published') {
        fields.published = Boolean(value)
      } else if (value === null || value === undefined || value === '') {
        fields[field] = null
      } else if (typeof value === 'string') {
        const trimmed = value.trim()
        const max = field === 'caption_en' ? 300 : 120
        if (trimmed.length > max) return jsonError(`${field} is too long.`, 400)
        fields[field] = trimmed
      } else {
        return jsonError(`Invalid ${field}.`, 400)
      }
    }

    if (Object.keys(fields).length === 0) return jsonError('Nothing to update.', 400)

    const ok = await updateVideo(id, fields)
    if (!ok) return jsonError('Video not found.', 404)
    await writeAuditLog(check.user.id, 'media.video.update', 'media', id, {
      title: (fields.caption_en as string) ?? existing.caption_en,
      published: fields.published as boolean
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.videos.update', err)
    return jsonError('Unable to update the video.', 500)
  }
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

// Adds a YouTube video by hand, for videos the channel sync does not pick up
// (a partner's upload, an unlisted link) or to publish one before the nightly
// sync runs. The optional thumbnail is an image already uploaded to the media
// library; its stored URL is resolved here rather than accepted from the
// client, so a video can only ever point at an image the site hosts.
export async function POST(request: Request) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as Record<string, unknown>
  const allowed = ['url', 'title', 'category', 'videoType', 'publishedAt', 'published', 'thumbnailMediaId']
  if (Object.keys(raw).some((key) => !allowed.includes(key))) return jsonError('Invalid payload field.', 400)

  const parsed = typeof raw.url === 'string' ? parseYoutubeUrl(raw.url) : null
  if (!parsed) return jsonError('Enter a valid YouTube video link.', 400)

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) return jsonError('A title is required.', 400)
  if (title.length > 300) return jsonError('The title is too long.', 400)

  const category = typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : 'Latest'
  if (category.length > 120) return jsonError('The category is too long.', 400)

  let videoType: 'video' | 'short' = parsed.isShort ? 'short' : 'video'
  if (raw.videoType !== undefined) {
    if (raw.videoType !== 'video' && raw.videoType !== 'short') return jsonError('Invalid video type.', 400)
    videoType = raw.videoType
  }

  let publishedAt = new Date().toISOString()
  if (raw.publishedAt !== undefined && raw.publishedAt !== null && raw.publishedAt !== '') {
    const date = typeof raw.publishedAt === 'string' && DATE_ONLY.test(raw.publishedAt) ? new Date(`${raw.publishedAt}T00:00:00Z`) : null
    if (!date || Number.isNaN(date.getTime())) return jsonError('Invalid publish date.', 400)
    publishedAt = date.toISOString()
  }

  try {
    let thumbnail = youtubeThumbnailUrl(parsed.youtubeId)
    let thumbnailMediaId: string | null = null
    if (raw.thumbnailMediaId !== undefined && raw.thumbnailMediaId !== null) {
      if (typeof raw.thumbnailMediaId !== 'string' || !isValidUuid(raw.thumbnailMediaId)) return jsonError('Invalid thumbnail.', 400)
      const media = await getMedia(raw.thumbnailMediaId)
      const url = media?.type === 'photo' ? asset(media.public_url) : null
      if (!url) return jsonError('The thumbnail image was not found.', 400)
      thumbnail = url
      thumbnailMediaId = media!.id
    }

    const existing = await findVideoByYoutubeId(parsed.youtubeId)
    if (existing) return jsonError('This video is already on the Videos page.', 409)

    const video = await createManualVideo({
      youtubeId: parsed.youtubeId,
      title,
      category,
      videoType,
      publishedAt,
      published: raw.published === undefined ? true : Boolean(raw.published),
      thumbnail,
      thumbnailMediaId,
      createdBy: check.user.id
    })
    await writeAuditLog(check.user.id, 'media.video.create', 'media', video.id, { title, youtubeId: parsed.youtubeId })
    return NextResponse.json({ data: video }, { status: 201 })
  } catch (err) {
    // The unique index on metadata->>youtubeId catches a concurrent add.
    if ((err as { code?: string })?.code === '23505') return jsonError('This video is already on the Videos page.', 409)
    logError('admin.videos.create', err)
    return jsonError('Unable to add the video.', 500)
  }
}
