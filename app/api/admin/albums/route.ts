import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../lib/api-utils'
import { writeAuditLog } from '../../../../lib/audit'
import { listAlbums, createAlbum } from '../../../../lib/albums-server'

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

export async function GET(request: Request) {
  const check = await requireApiPermission('media.view')
  if (!check.ok) return jsonError(check.message, check.status)

  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const search = url.searchParams.get('q') ?? ''
  const status = url.searchParams.get('status') ?? ''

  try {
    const result = await listAlbums({ page: Number.isFinite(page) && page > 0 ? page : 1, perPage: 24, search, status })
    return NextResponse.json({ data: result.items, total: result.total, totalPages: result.totalPages })
  } catch (err) {
    logError('admin.albums.list', err)
    return jsonError('Unable to load albums.', 500)
  }
}

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
  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const record: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      const value = (body as Record<string, unknown>)[field]
      if (field === 'published') {
        record.published = Boolean(value)
      } else if (field === 'cover_media_id') {
        if (value && typeof value === 'string' && isValidUuid(value)) record.cover_media_id = value
        else if (value === null || value === '') record.cover_media_id = null
        else return jsonError('Invalid cover media ID.', 400)
      } else {
        record[field] = cleanText(value, field, TEXT_LIMITS[field])
      }
    }

    if (!record.title_en) return jsonError('A title is required.', 400)
    if (!record.slug) return jsonError('A slug is required.', 400)

    const album = await createAlbum({ ...record, created_by: check.user.id })
    if (!album) return jsonError('Unable to create the album.', 500)
    await writeAuditLog(check.user.id, 'albums.create', 'albums', album.id, { title: album.title_en })
    return NextResponse.json({ data: album }, { status: 201 })
  } catch (err) {
    logError('admin.albums.create', err)
    return jsonError('Unable to create the album.', 500)
  }
}