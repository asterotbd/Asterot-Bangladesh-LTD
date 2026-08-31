import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiPermission } from '../../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { jsonError, logError, isValidUuid, parseJsonBody } from '../../../../../lib/api-utils'
import { writeAuditLog } from '../../../../../lib/audit'
import { getFaqItem, updateFaqItem, deleteFaqItem, normalizeFaqOrder } from '../../../../../lib/faq-server'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = [
  'question_en',
  'answer_en',
  'question_bn',
  'answer_bn',
  'category',
  'display_order',
  'status'
]

const TEXT_LIMITS: Record<string, number> = {
  question_en: 500,
  answer_en: 5000,
  question_bn: 500,
  answer_bn: 5000,
  category: 100
}

const FAQ_STATUSES = ['draft', 'published', 'archived'] as const

function cleanText(value: unknown, key: string, max: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error(`Invalid ${key}.`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`${key} is too long.`)
  return trimmed
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('content.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid FAQ item ID.', 400)
  try {
    const item = await getFaqItem(params.id)
    if (!item) return jsonError('FAQ item not found.', 404)
    return NextResponse.json({ data: item })
  } catch (err) {
    logError('admin.faq.get', err)
    return jsonError('Unable to load the FAQ item.', 500)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('content.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.faqMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.faqMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid FAQ item ID.', 400)

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Invalid payload.', 400)
  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key))
  if (unknown.length > 0) return jsonError('Invalid payload field.', 400)

  try {
    const fields: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      const value = (body as Record<string, unknown>)[field]
      if (field === 'status') {
        if (!(FAQ_STATUSES as readonly string[]).includes(value as (typeof FAQ_STATUSES)[number])) return jsonError('Invalid status.', 400)
        fields.status = value
      } else if (field === 'display_order') {
        if (value === undefined || value === null) continue
        const n = Number(value)
        if (!Number.isFinite(n) || n < 0) return jsonError('Invalid display order.', 400)
        fields.display_order = Math.floor(n)
      } else {
        fields[field] = cleanText(value, field, TEXT_LIMITS[field])
      }
    }

    const existing = await getFaqItem(params.id)
    if (!existing) return jsonError('FAQ item not found.', 404)

    const status = (fields.status as string) ?? existing.status ?? 'draft'
    fields.published = status === 'published'

    const ok = await updateFaqItem(params.id, fields)
    if (!ok) return jsonError('FAQ item not found.', 404)
    await writeAuditLog(check.user.id, 'faq.update', 'faq', params.id, {
      question: (fields.question_en as string) ?? existing.question_en,
      status
    })
    revalidatePath('/faq')
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.faq.update', err)
    return jsonError('Unable to update the FAQ item.', 500)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('content.delete')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.faqMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.faqMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid FAQ item ID.', 400)

  try {
    const existing = await getFaqItem(params.id)
    if (!existing) return jsonError('FAQ item not found.', 404)
    const ok = await deleteFaqItem(params.id)
    if (!ok) return jsonError('FAQ item not found.', 404)
    await normalizeFaqOrder()
    await writeAuditLog(check.user.id, 'faq.delete', 'faq', params.id, { question: existing.question_en })
    revalidatePath('/faq')
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('admin.faq.delete', err)
    return jsonError('Unable to delete the FAQ item.', 500)
  }
}