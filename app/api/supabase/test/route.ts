import { NextResponse } from 'next/server'
import getAdminSupabase from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = getAdminSupabase()
    // safe lightweight test: count roles (no sensitive data exposed)
    const { data, error } = await admin.from('roles').select('id').limit(1)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, sample: (data || []).length })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 })
  }
}
