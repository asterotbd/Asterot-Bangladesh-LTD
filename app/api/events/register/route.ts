import { NextResponse } from 'next/server'
import createServerClient from '../../../../lib/supabaseServer'
import { getPublishedEventBySlug } from '../../../../lib/events-server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'You must be signed in to register for this event.' }, { status: 401 })
  }
  const userId = session.user.id

  const body = await request.json().catch(() => null)
  const slug = body && typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!slug) {
    return NextResponse.json({ error: 'Event slug is required.' }, { status: 400 })
  }
  const notes = body && typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : ''

  const event = await getPublishedEventBySlug(slug)
  if (!event) {
    return NextResponse.json({ error: 'Event not found or not open for registration.' }, { status: 404 })
  }

  if (event.registration_deadline) {
    const deadline = new Date(event.registration_deadline)
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Registration for this event is closed.' }, { status: 409 })
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
    return NextResponse.json({ error: 'You have already registered for this event.' }, { status: 409 })
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
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ registration }, { status: 201 })
}
