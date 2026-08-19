import { NextResponse } from 'next/server'
import createServerClient from '../../../../lib/supabaseServer'
import { getPublishedEventBySlug } from '../../../../lib/events-server'
import { jsonError, logError, parseJsonBody } from '../../../../lib/api-utils'
import { verifyCsrfRequest } from '../../../../lib/csrf'
import { isRateLimited, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

const NOTES_MAX_LENGTH = 500
const SLUG_MAX_LENGTH = 200

export async function POST(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return jsonError('You must be signed in to register for this event.', 401)
  }
  const userId = user.id

  const csrf = verifyCsrfRequest(request)
  if (!csrf.ok) return jsonError(csrf.error, csrf.status)

  if (await isRateLimited(RATE_LIMIT_RULES.eventRegistration.prefix, userId, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_RULES.eventRegistration.max)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  const body = await parseJsonBody(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Invalid payload.', 400)
  }
  const unknown = Object.keys(body).filter((key) => key !== 'slug' && key !== 'notes')
  if (unknown.length > 0) {
    return jsonError('Invalid payload field.', 400)
  }

  const slug = (body as Record<string, unknown>).slug
  if (typeof slug !== 'string' || !slug.trim()) {
    return jsonError('Event slug is required.', 400)
  }
  const trimmedSlug = slug.trim()
  if (trimmedSlug.length > SLUG_MAX_LENGTH) {
    return jsonError('Invalid event slug.', 400)
  }

  const notesValue = (body as Record<string, unknown>).notes
  const notes = typeof notesValue === 'string' ? notesValue.trim().slice(0, NOTES_MAX_LENGTH) : ''

  const event = await getPublishedEventBySlug(trimmedSlug)
  if (!event) {
    return jsonError('Event not found or not open for registration.', 404)
  }

  if (event.registration_deadline) {
    const deadline = new Date(event.registration_deadline)
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) {
      return jsonError('Registration for this event is closed.', 409)
    }
  }

  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', event.id)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()
  if (existing) {
    return jsonError('You have already registered for this event.', 409)
  }

  const payload = {
    user_id: userId,
    event_id: event.id,
    status: 'pending',
    form_data: notes ? { notes } : null
  }
  const { data: registration, error: insertError } = await supabase
    .from('registrations')
    .insert(payload as any)
    .select('id, status')
    .single()
  if (insertError) {
    if (insertError.code === '23505') {
      return jsonError('You have already registered for this event.', 409)
    }
    logError('events.register', insertError)
    return jsonError('Unable to complete your registration.', 500)
  }

  return NextResponse.json({ registration }, { status: 201 })
}