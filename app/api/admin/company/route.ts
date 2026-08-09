import { NextResponse } from 'next/server'
import getAdminSupabase from '../../../../lib/supabaseAdmin'
import { getUserRoles } from '../../../../lib/auth'
import createServerClient from '../../../../lib/supabaseServer'

export const dynamic = 'force-dynamic'

async function requireAdminSession() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    return { ok: false, status: 401, message: 'Not authenticated' }
  }
  const roles = await getUserRoles(session.user.id)
  const allowed = ['super_admin', 'admin']
  const isAdmin = (roles || []).some((r: any) => allowed.includes(String(r)))
  if (!isAdmin) return { ok: false, status: 403, message: 'Forbidden' }
  return { ok: true, session }
}

export async function GET() {
  const check = await requireAdminSession()
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('company_info').select('*').limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

const ALLOWED_FIELDS = ['name_en', 'founded_date', 'tagline_en', 'slogan_en', 'short_description_en'] as const

function pickCompanyFields(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const source = body as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in source) out[key] = source[key]
  }
  return out
}

export async function PUT(request: Request) {
  const check = await requireAdminSession()
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
  const body = await request.json().catch(() => null)
  const fields = pickCompanyFields(body)
  if (!fields) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const admin = getAdminSupabase()
  // Upsert single company_info row (client is untyped, so pass the validated payload through)
  const userId = (check.session as any).user.id
  const payload = {
    ...fields,
    updated_at: new Date().toISOString(),
    created_by: userId
  }
  const { data, error } = await admin.from('company_info').upsert(payload as any, { onConflict: 'id' }).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
