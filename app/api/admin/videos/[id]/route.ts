import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import { getVideo, updateVideo, deleteVideo } from '../../../../../lib/videos-server'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = ['caption_en', 'caption_bn', 'category', 'published']

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid video ID.', 400)
  try {
    const video = await getVideo(params.id)
    if (!video) return jsonError('Video not found.', 404)
    return NextResponse.json({ data: video })
  } catch (err) {
    logError('admin.videos.get', err)
    return jsonError('Unable to load the video.', 500)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid video ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const existing = await getVideo(params.id)
    if (!existing) return jsonError('Video not found.', 404)

    const fields: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      const value = (body as Record<string, unknown>)[field]
      if (field === 'published') {
        fields.published = Boolean(value)
      } else if (value === null || value === undefined || value === '') {
        fields[field] = null
      } else if (typeof value === 'string') {
        const trimmed = value.trim()
        const max = field === 'caption_en' || field === 'caption_bn' ? 300 : 120
        if (trimmed.length > max) return jsonError(`${field} is too long.`, 400)
        fields[field] = trimmed
      } else {
        return jsonError(`Invalid ${field}.`, 400)
      }
    }

    const ok = await updateVideo(params.id, fields)
    if (!ok) return jsonError('Video not found.', 404)
    await writeAuditLog(check.user.id, 'media.video.update', 'media', params.id, {
      title: (fields.caption_en as string) ?? existing.caption_en,
      published: fields.published as boolean
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.videos.update', err)
    return jsonError('Unable to update the video.', 500)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid video ID.', 400)

  try {
    const existing = await getVideo(params.id)
    if (!existing) return jsonError('Video not found.', 404)
    const ok = await deleteVideo(params.id)
    if (!ok) return jsonError('Video not found.', 404)
    await writeAuditLog(check.user.id, 'media.video.delete', 'media', params.id, { title: existing.caption_en })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.videos.delete', err)
    return jsonError('Unable to delete the video.', 500)
  }
}