import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory, categorySlugify } from '../../../../../lib/categories-server'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = ['name_en', 'name_bn', 'slug', 'type']

function cleanText(value: unknown, key: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error(`Invalid ${key}.`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`${key} is too long.`)
  return trimmed
}

export async function GET() {
  const check = await requireApiPermission('content.view')
  if (!check.ok) return jsonError(check.message, check.status)
  const categories = await listCategories()
  return NextResponse.json({ data: categories })
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
      record[field] = field === 'name_en' ? cleanText((body as Record<string, unknown>)[field], field, 100) : cleanText((body as Record<string, unknown>)[field], field, 200)
    }
    if (!record.name_en) return jsonError('A name is required.', 400)
    if (!record.slug) record.slug = categorySlugify(record.name_en as string)
    if (!record.type) record.type = 'project'

    const category = await createCategory(record)
    if (!category) return jsonError('Unable to create the category.', 500)
    await writeAuditLog(check.user.id, 'content.update', 'categories', category.id, { name: category.name_en })
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (err) {
    logError('admin.categories.create', err)
    return jsonError('Unable to create the category.', 500)
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
  if (typeof raw.id !== 'string' || !isValidUuid(raw.id)) return jsonError('Invalid category ID.', 400)
  const unknown = Object.keys(body).filter((key) => key !== 'id' && !ALLOWED_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const existing = await getCategory(raw.id)
    if (!existing) return jsonError('Category not found.', 404)
    const fields: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      const value = (body as Record<string, unknown>)[field]
      fields[field] = field === 'name_en' ? cleanText(value, field, 100) : cleanText(value, field, 200)
    }
    const ok = await updateCategory(raw.id, fields)
    if (!ok) return jsonError('Category not found.', 404)
    await writeAuditLog(check.user.id, 'content.update', 'categories', raw.id, {
      name: (fields.name_en as string) ?? existing.name_en
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.categories.update', err)
    return jsonError('Unable to update the category.', 500)
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
  if (typeof raw.id !== 'string' || !isValidUuid(raw.id)) return jsonError('Invalid category ID.', 400)

  try {
    const existing = await getCategory(raw.id)
    if (!existing) return jsonError('Category not found.', 404)
    const ok = await deleteCategory(raw.id)
    if (!ok) return jsonError('Unable to delete the category.', 500)
    await writeAuditLog(check.user.id, 'content.delete', 'categories', raw.id, { name: existing.name_en })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.categories.delete', err)
    return jsonError('Unable to delete the category.', 500)
  }
}