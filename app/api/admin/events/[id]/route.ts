import { NextResponse } from 'next/server'
import createServerClient from '../../../../../lib/supabaseServer'
import { getUserRoles } from '../../../../../lib/auth'
import getAdminSupabase from '../../../../../lib/supabaseAdmin'
import { getEventById, slugify, EVENT_ADMIN_ROLES } from '../../../../../lib/events-server'

export const dynamic = 'force-dynamic'

async function requireAdminSession() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    return { ok: false, status: 401, message: 'Not authenticated' }
  }
  const roles = await getUserRoles(session.user.id)
  const allowed = (roles || []).some((r: any) => EVENT_ADMIN_ROLES.includes(String(r)))
  if (!allowed) return { ok: false, status: 403, message: 'Forbidden' }
  return { ok: true, session }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const check = await requireAdminSession()
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
  const event = await getEventById(params.id)
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  return NextResponse.json({ data: event })
}

const ALLOWED_FIELDS = [
  'title_en',
  'title_bn',
  'slug',
  'description_en',
  'description_bn',
  'category_id',
  'date',
  'time',
  'location',
  'registration_deadline',
  'capacity',
  'published'
] as const

function pickEventFields(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const source = body as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in source) out[key] = source[key]
  }
  return out
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const check = await requireAdminSession()
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
  const body = await request.json().catch(() => null)
  const fields = pickEventFields(body)
  if (!fields) return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  if ('title_en' in fields && (typeof fields.title_en !== 'string' || !fields.title_en.trim())) {
    return NextResponse.json({ error: 'title_en cannot be empty.' }, { status: 400 })
  }
  if (typeof fields.slug === 'string' && !fields.slug.trim()) {
    fields.slug = typeof fields.title_en === 'string' ? slugify(fields.title_en) : ''
  }
  if (fields.capacity !== undefined && fields.capacity !== null && typeof fields.capacity !== 'number') {
    fields.capacity = Number(fields.capacity) || null
  }
  if ('published' in fields) fields.published = Boolean(fields.published)

  const admin = getAdminSupabase()
  const payload = { ...fields, updated_at: new Date().toISOString() }
  const { data, error } = await (admin.from('events') as any).update(payload as any).eq('id', params.id).select().maybeSingle()
  if (error) {
    if (String(error.message).includes('duplicate key') || String(error.message).includes('unique')) {
      return NextResponse.json({ error: 'An event with this slug already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  return NextResponse.json({ data })
}
