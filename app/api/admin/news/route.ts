import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import getAdminSupabase from '../../../../lib/supabaseAdmin'
import { getAllNews } from '../../../../lib/news-server'
import { slugify } from '../../../../lib/events-server'
import { jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { validateNewsPayload } from '../../../../lib/api-validation'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'
import { writeAuditLog } from '../../../../lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = await requireApiPermission('news.view')
  if (!check.ok) return jsonError(check.message, check.status)
  try {
    const news = await getAllNews()
    return NextResponse.json({ data: news })
  } catch (err) {
    logError('admin.news.list', err)
    return jsonError('Unable to load news.', 500)
  }
}

export async function POST(request: Request) {
  const check = await requireApiPermission('news.create')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.newsMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.newsMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  const result = validateNewsPayload(body, { requireTitle: true })
  if ('error' in result) return jsonError(result.error, 400)
  const fields = result.fields

  if (fields.slug === undefined || fields.slug === '') {
    const generated = slugify(typeof fields.title_en === 'string' ? fields.title_en : '')
    if (!generated) return jsonError('A valid slug is required.', 400)
    fields.slug = generated
  }

  const admin = getAdminSupabase()
  const userId = check.user.id
  const published = fields.published === true
  const payload = {
    ...fields,
    published,
    published_at: published
      ? (typeof fields.published_at === 'string' && fields.published_at ? fields.published_at : new Date().toISOString())
      : (fields.published_at ?? null),
    author_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  const { data, error } = await admin.from('news').insert(payload as any).select().single()
  if (error) {
    if (error.code === '23505') {
      return jsonError('A news article with this slug already exists.', 409)
    }
    logError('admin.news.create', error)
    return jsonError('Unable to create the news article.', 500)
  }
  await writeAuditLog(check.user.id, 'news.create', 'news', data.id, {
    title: data.title_en,
    status: (data.status as string) ?? (data.published ? 'published' : 'draft')
  })
  return NextResponse.json({ data }, { status: 201 })
}