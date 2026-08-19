import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../lib/auth'
import getAdminSupabase from '../../../../lib/supabaseAdmin'
import { slugify, getAllEvents } from '../../../../lib/events-server'
import { jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { validateEventPayload } from '../../../../lib/api-validation'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = await requireApiPermission('events.view')
  if (!check.ok) return jsonError(check.message, check.status)
  const events = await getAllEvents()
  return NextResponse.json({ data: events })
}

export async function POST(request: Request) {
  const check = await requireApiPermission('events.create')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.eventsMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.eventsMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  const result = validateEventPayload(body, { requireTitle: true })
  if ('error' in result) return jsonError(result.error, 400)
  const fields = result.fields

  if (fields.slug === undefined || fields.slug === '') {
    const generated = slugify(typeof fields.title_en === 'string' ? fields.title_en : '')
    if (!generated) return jsonError('A valid slug is required.', 400)
    fields.slug = generated
  }

  const admin = getAdminSupabase()
  const userId = check.user.id
  const payload = {
    ...fields,
    published: fields.published ?? false,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  const { data, error } = await admin.from('events').insert(payload as any).select().single()
  if (error) {
    if (error.code === '23505') {
      return jsonError('An event with this slug already exists.', 409)
    }
    logError('admin.events.create', error)
    return jsonError('Unable to create the event.', 500)
  }
  return NextResponse.json({ data }, { status: 201 })
}