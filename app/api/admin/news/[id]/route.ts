import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiPermission } from '../../../../../lib/auth'
import getAdminSupabase from '../../../../../lib/supabaseAdmin'
import { getNewsById, deleteNews } from '../../../../../lib/news-server'
import { slugify } from '../../../../../lib/events-server'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { validateNewsPayload } from '../../../../../lib/api-validation'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'
import { writeAuditLog } from '../../../../../lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('news.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid news ID.', 400)
  const news = await getNewsById(params.id)
  if (!news) return jsonError('News article not found.', 404)
  return NextResponse.json({ data: news })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('news.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.newsMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.newsMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  if (!isValidUuid(params.id)) return jsonError('Invalid news ID.', 400)

  const body = await parseJsonBody(request)
  const result = validateNewsPayload(body, { requireTitle: false })
  if ('error' in result) return jsonError(result.error, 400)
  const fields = result.fields

  if (fields.slug === '') {
    const generated = slugify(typeof fields.title_en === 'string' ? fields.title_en : '')
    if (!generated) return jsonError('A valid slug is required.', 400)
    fields.slug = generated
  }

  const admin = getAdminSupabase()
  const payload: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() }
  // The news_sync_status trigger derives `published` from `status`, so when a
  // caller toggles only `published` (e.g. the admin table quick-toggle) we must
  // derive `status` from it too, or the trigger would silently cancel the change.
  if ('published' in payload && !('status' in payload)) {
    payload.status = payload.published === true ? 'published' : 'draft'
  }
  if ('published_at' in payload && (payload.published_at === '' || payload.published_at === null)) {
    payload.published_at = payload.published ? new Date().toISOString() : null
  }
  if (payload.published === true && (payload.published_at === null || payload.published_at === undefined || payload.published_at === '')) {
    payload.published_at = new Date().toISOString()
  }

  const { data, error } = await (admin.from('news') as any).update(payload as any).eq('id', params.id).select().maybeSingle()
  if (error) {
    if (error.code === '23505') {
      return jsonError('A news article with this slug already exists.', 409)
    }
    logError('admin.news.update', error)
    return jsonError('Unable to update the news article.', 500)
  }
  if (!data) return jsonError('News article not found.', 404)
  await writeAuditLog(check.user.id, 'news.update', 'news', params.id, {
    title: data.title_en,
    status: (data.status as string) ?? (data.published ? 'published' : 'draft')
  })
  revalidatePath('/news')
  return NextResponse.json({ data })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('news.delete')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)
  if (await isRateLimited(RATE_LIMIT_RULES.newsMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.newsMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }
  if (!isValidUuid(params.id)) return jsonError('Invalid news ID.', 400)

  const news = await getNewsById(params.id)
  if (!news) return jsonError('News article not found.', 404)
  const ok = await deleteNews(params.id)
  if (!ok) return jsonError('Unable to delete the news article.', 500)
  await writeAuditLog(check.user.id, 'news.delete', 'news', params.id, { title: news.title_en })
  revalidatePath('/news')
  return NextResponse.json({ ok: true })
}