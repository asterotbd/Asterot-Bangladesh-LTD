import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs'
import getAdminSupabase from '../../../../lib/supabaseAdmin'
import { getUserRoles } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

async function requireAdminSession() {
  const supabase = createServerComponentSupabaseClient({ headers: () => headers(), cookies: () => cookies() })
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

export async function PUT(request: Request) {
  const check = await requireAdminSession()
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
  const body = await request.json()
  const admin = getAdminSupabase()
  // Upsert single company_info row
  const userId = (check.session as any).user.id
  const payload = {
    ...body,
    updated_at: new Date().toISOString(),
    created_by: userId
  }
  const { data, error } = await admin.from('company_info').upsert(payload, { onConflict: 'id' }).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
