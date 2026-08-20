import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import { getAlbum, updateAlbum, deleteAlbum } from '../../../../../lib/albums-server'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = ['title_en', 'title_bn', 'slug', 'description_en', 'description_bn', 'cover_media_id', 'published']

const TEXT_LIMITS: Record<string, number> = {
  title_en: 200,
  title_bn: 200,
  slug: 200,
  description_en: 2000,
  description_bn: 2000
}

function cleanText(value: unknown, key: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error(`Invalid ${key}.`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`${key} is too long.`)
  return trimmed
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('media.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid album ID.', 400)
  try {
    const album = await getAlbum(params.id)
    if (!album) return jsonError('Album not found.', 404)
    return NextResponse.json({ data: album })
  } catch (err) {
    logError('admin.albums.get', err)
    return jsonError('Unable to load the album.', 500)
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
  if (!isValidUuid(params.id)) return jsonError('Invalid album ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const existing = await getAlbum(params.id)
    if (!existing) return jsonError('Album not found.', 404)

    const fields: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      const value = (body as Record<string, unknown>)[field]
      if (field === 'published') {
        fields.published = Boolean(value)
      } else if (field === 'cover_media_id') {
        if (value && typeof value === 'string' && isValidUuid(value)) fields.cover_media_id = value
        else if (value === null || value === '') fields.cover_media_id = null
        else return jsonError('Invalid cover media ID.', 400)
      } else {
        fields[field] = cleanText(value, field, TEXT_LIMITS[field])
      }
    }

    if (fields.slug === '' && !existing.slug) return jsonError('A slug is required.', 400)
    if (fields.title_en === '' && !existing.title_en) return jsonError('A title is required.', 400)

    const ok = await updateAlbum(params.id, fields)
    if (!ok) return jsonError('Album not found.', 404)
    await writeAuditLog(check.user.id, 'albums.update', 'albums', params.id, {
      title: (fields.title_en as string) ?? existing.title_en,
      published: fields.published as boolean
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.albums.update', err)
    return jsonError('Unable to update the album.', 500)
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
  if (!isValidUuid(params.id)) return jsonError('Invalid album ID.', 400)

  try {
    const existing = await getAlbum(params.id)
    if (!existing) return jsonError('Album not found.', 404)
    const ok = await deleteAlbum(params.id)
    if (!ok) return jsonError('Album not found.', 404)
    await writeAuditLog(check.user.id, 'albums.delete', 'albums', params.id, { title: existing.title_en })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.albums.delete', err)
    return jsonError('Unable to delete the album.', 500)
  }
}