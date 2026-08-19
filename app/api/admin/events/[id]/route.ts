import { NextResponse } from 'next/server'
import { requireApiPermission } from '../../../../../lib/auth'
import getAdminSupabase from '../../../../../lib/supabaseAdmin'
import { getEventById, slugify } from '../../../../../lib/events-server'
import { isValidUuid, jsonError, logError, parseJsonBody } from '../../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../../lib/csrf'
import { validateEventPayload } from '../../../../../lib/api-validation'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('events.view')
  if (!check.ok) return jsonError(check.message, check.status)
  if (!isValidUuid(params.id)) return jsonError('Invalid event ID.', 400)
  const event = await getEventById(params.id)
  if (!event) return jsonError('Event not found.', 404)
  return NextResponse.json({ data: event })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await requireApiPermission('events.edit')
  if (!check.ok) return jsonError(check.message, check.status)
  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.eventsMutate.prefix, check.user.id, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.eventsMutate.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  if (!isValidUuid(params.id)) return jsonError('Invalid event ID.', 400)

  const body = await parseJsonBody(request)
  const result = validateEventPayload(body, { requireTitle: false })
  if ('error' in result) return jsonError(result.error, 400)
  const fields = result.fields

  if (fields.slug === '') {
    const generated = slugify(typeof fields.title_en === 'string' ? fields.title_en : '')
    if (!generated) return jsonError('A valid slug is required.', 400)
    fields.slug = generated
  }

  const admin = getAdminSupabase()
  const payload = { ...fields, updated_at: new Date().toISOString() }
  const { data, error } = await (admin.from('events') as any).update(payload as any).eq('id', params.id).select().maybeSingle()
  if (error) {
    if (error.code === '23505') {
      return jsonError('An event with this slug already exists.', 409)
    }
    logError('admin.events.update', error)
    return jsonError('Unable to update the event.', 500)
  }
  if (!data) return jsonError('Event not found.', 404)
  return NextResponse.json({ data })
}