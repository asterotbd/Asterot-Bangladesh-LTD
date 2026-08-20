import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { getMedia, updateMedia, deleteMedia, deleteStorageFile, MEDIA_TYPES } from '../../../../../lib/media-server'
import { writeAuditLog } from '../../../../../lib/audit'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

const EDITABLE = ['alt_en', 'alt_bn', 'caption_en', 'caption_bn', 'category', 'type'] as const

const TEXT_MAX: Record<string, number> = {
  alt_en: 300,
  alt_bn: 300,
  caption_en: 500,
  caption_bn: 500,
  category: 120
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid media ID.', 400)
  try {
    const media = await getMedia(params.id)
    if (!media) return jsonError('Media not found.', 404)
    return NextResponse.json({ data: media })
  } catch (err) {
    logError('admin.media.get', err)
    return jsonError('Unable to load the media item.', 500)
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  if (!isValidUuid(params.id)) return jsonError('Invalid media ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  if (Object.keys(body).length === 0) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => !(EDITABLE as readonly string[]).includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  const payload: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (!(key in body)) continue
    const value = (body as Record<string, unknown>)[key]
    if (key === 'type') {
      if (typeof value !== 'string' || !(MEDIA_TYPES as readonly string[]).includes(value as (typeof MEDIA_TYPES)[number])) {
        return jsonError('Invalid type.', 400)
      }
      payload.type = value
      continue
    }
    if (value === null || value === undefined) {
      payload[key] = null
      continue
    }
    if (typeof value !== 'string') return jsonError(`Invalid ${key}.`, 400)
    const trimmed = value.trim()
    if (trimmed === '') {
      payload[key] = null
    } else if (trimmed.length > TEXT_MAX[key]) {
      return jsonError(`Invalid ${key}.`, 400)
    } else {
      payload[key] = trimmed
    }
  }

  try {
    const updated = await updateMedia(params.id, payload)
    if (!updated) return jsonError('Media not found.', 404)
    await writeAuditLog(check.user.id, 'media.update', 'media', params.id, { fields: Object.keys(payload) })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.media.update', err)
    return jsonError('Unable to update the media item.', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.manage')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(_)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.mediaMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.mediaMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  if (!isValidUuid(params.id)) return jsonError('Invalid media ID.', 400)

  try {
    const { ok, storagePath } = await deleteMedia(params.id)
    if (!ok) return jsonError('Media not found.', 404)
    if (storagePath) await deleteStorageFile(storagePath)
    await writeAuditLog(check.user.id, 'media.delete', 'media', params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.media.delete', err)
    return jsonError('Unable to delete the media item.', 500)
  }
}