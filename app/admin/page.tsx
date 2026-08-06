export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../lib/supabaseServer'
import getAdminSupabase from '../../lib/supabaseAdmin'

export default async function AdminPage(){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    redirect('/admin/login')
  }

  const admin = getAdminSupabase()
  const { data: ur } = await admin.from('user_roles').select('role_id').eq('user_id', session.user.id)
  const roleIds = (ur || []).map((r: any) => r.role_id)
  const { data: roles } = await admin.from('roles').select('name').in('id', roleIds)
  const roleNames = (roles || []).map((r: any) => r.name)
  const allowed = ['super_admin','admin','editor','coach','finance']
  const has = roleNames.find((r:any) => allowed.includes(r))
  if (!has) redirect('/account')

  return (
    <div className="pt-24">
      <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
      <p className="mt-4">Welcome, {session.user.email}</p>
      <p className="mt-2 text-sm text-gray-400">Roles: {roleNames.join(', ') || '—'}</p>
      <div className="mt-4">
        <a href="/api/auth/signout" className="text-primary">Logout</a>
      </div>
    </div>
  )
}
