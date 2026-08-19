import { NextResponse } from 'next/server'
import createServerClient from '../../../../lib/supabaseServer'
import { getUserPermissions } from '../../../../lib/auth'
import { hasPermission } from '../../../../lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const permissions = await getUserPermissions(user.id)
  const allowed = hasPermission(permissions, 'dashboard.view')
  const target = allowed ? '/admin' : '/account?notice=admin_access_denied'

  return NextResponse.redirect(new URL(target, request.url))
}