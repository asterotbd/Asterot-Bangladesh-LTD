import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiPermission } from '../../../../lib/auth'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'
import { jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { writeAuditLog } from '../../../../lib/audit'
import {
  listFaq,
  createFaqItem,
  normalizeFaqOrder,
  getFaqCategories
} from '../../../../lib/faq-server'

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

export async function GET(request: Request) {
  const check = await requireApiPermission('content.view')
  if (!check.ok) return jsonError(check.message, check.status)

  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10)
  const search = url.searchParams.get('q') ?? ''
  const status = url.searchParams.get('status') ?? ''
  const category = url.searchParams.get('category') ?? ''

  try {
    const [result, categories] = await Promise.all([
      listFaq({ page: Number.isFinite(page) && page > 0 ? page : 1, perPage: 50, search, status, category }),
      getFaqCategories()
    ])
    return NextResponse.json({ data: result.items, categories, total: result.total, totalPages: result.totalPages })
  } catch (err) {
    logError('admin.faq.list', err)
    return jsonError('Unable to load FAQ items.', 500)
  }
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
      if (field === 'status') {
        if (!(FAQ_STATUSES as readonly string[]).includes(value as (typeof FAQ_STATUSES)[number])) return jsonError('Invalid status.', 400)
        record.status = value
      } else if (field === 'display_order') {
        if (value === undefined || value === null) continue
        const n = Number(value)
        if (!Number.isFinite(n) || n < 0) return jsonError('Invalid display order.', 400)
        record.display_order = Math.floor(n)
      } else {
        record[field] = cleanText(value, field, TEXT_LIMITS[field])
      }
    }

    if (!record.question_en) return jsonError('A question is required.', 400)
    if (!record.answer_en) return jsonError('An answer is required.', 400)
    record.published = record.status === 'published'

    const item = await createFaqItem(record)
    if (!item) return jsonError('Unable to create the FAQ item.', 500)
    await writeAuditLog(check.user.id, 'faq.create', 'faq', item.id, { question: item.question_en })
    revalidatePath('/faq')
    revalidatePath('/')
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (err) {
    logError('admin.faq.create', err)
    return jsonError('Unable to create the FAQ item.', 500)
  }
}