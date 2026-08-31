import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import { listServices, createService, getService, updateService, deleteService } from '../../../../../lib/services-server'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = [
  'title_en',
  'title_bn',
  'short_description_en',
  'short_description_bn',
  'description_en',
  'description_bn',
  'features',
  'media_id',
  'published',
  'display_order'
]

const TEXT_LIMITS: Record<string, number> = {
  title_en: 200,
  title_bn: 200,
  short_description_en: 500,
  short_description_bn: 500,
  description_en: 5000,
  description_bn: 5000
}

function cleanText(value: unknown, key: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error(`Invalid ${key}.`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`${key} is too long.`)
  return trimmed
}

export async function GET(request: Request) {
  const check = await requireApiPermission('content.view')
  if (!check.ok) return jsonError(check.message, check.status)
  const url = new URL(request.url)
  const status = url.searchParams.get('status') ?? ''
  const services = await listServices({ status })
  return NextResponse.json({ data: services })
}

export async function POST(request: Request) {
  const check = await requireApiPermission('content.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.faqMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.faqMutate.max)) {
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
      } else if (field === 'display_order') {
        const n = Number(value ?? 0)
        record.display_order = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
      } else if (field === 'features') {
        record.features = value ?? null
      } else if (field === 'media_id') {
        if (value === null || value === '' || value === undefined) {
          record.media_id = null
        } else if (typeof value === 'string' && isValidUuid(value)) {
          record.media_id = value
        } else {
          return jsonError('Invalid media ID.', 400)
        }
      } else {
        record[field] = cleanText(value, field, TEXT_LIMITS[field])
      }
    }

    if (!record.title_en) return jsonError('A title is required.', 400)

    const service = await createService(record)
    if (!service) return jsonError('Unable to create the capability.', 500)
    await writeAuditLog(check.user.id, 'content.update', 'services', service.id, { title: service.title_en })
    revalidatePath('/')
    return NextResponse.json({ data: service }, { status: 201 })
  } catch (err) {
    logError('admin.services.create', err)
    return jsonError('Unable to create the capability.', 500)
  }
}

export async function PUT(request: Request) {
  const check = await requireApiPermission('content.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.faqMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.faqMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as { id?: unknown }
  if (typeof raw.id !== 'string' || !isValidUuid(raw.id)) return jsonError('Invalid service ID.', 400)
  const unknown = Object.keys(body).filter((key) => key !== 'id' && !ALLOWED_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const existing = await getService(raw.id)
    if (!existing) return jsonError('Capability not found.', 404)

    const fields: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      const value = (body as Record<string, unknown>)[field]
      if (field === 'published') {
        fields.published = Boolean(value)
      } else if (field === 'display_order') {
        const n = Number(value ?? 0)
        fields.display_order = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
      } else if (field === 'features') {
        fields.features = value ?? null
      } else if (field === 'media_id') {
        if (value === null || value === '' || value === undefined) {
          fields.media_id = null
        } else if (typeof value === 'string' && isValidUuid(value)) {
          fields.media_id = value
        } else {
          return jsonError('Invalid media ID.', 400)
        }
      } else {
        fields[field] = cleanText(value, field, TEXT_LIMITS[field])
      }
    }

    if (fields.title_en === '' && !existing.title_en) return jsonError('A title is required.', 400)

    const ok = await updateService(raw.id, fields)
    if (!ok) return jsonError('Capability not found.', 404)
    await writeAuditLog(check.user.id, 'content.update', 'services', raw.id, {
      title: (fields.title_en as string) ?? existing.title_en,
      published: fields.published as boolean
    })
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.services.update', err)
    return jsonError('Unable to update the capability.', 500)
  }
}

export async function DELETE(request: Request) {
  const check = await requireApiPermission('content.delete')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.faqMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.faqMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const raw = body as { id?: unknown }
  if (typeof raw.id !== 'string' || !isValidUuid(raw.id)) return jsonError('Invalid service ID.', 400)

  try {
    const existing = await getService(raw.id)
    if (!existing) return jsonError('Capability not found.', 404)
    const ok = await deleteService(raw.id)
    if (!ok) return jsonError('Capability not found.', 404)
    await writeAuditLog(check.user.id, 'content.delete', 'services', raw.id, { title: existing.title_en })
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.services.delete', err)
    return jsonError('Unable to delete the capability.', 500)
  }
}