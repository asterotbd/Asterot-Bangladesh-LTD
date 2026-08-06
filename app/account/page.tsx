export const dynamic = 'force-dynamic'
import createServerClient from '../../lib/supabaseServer'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import getAdminSupabase from '../../lib/supabaseAdmin'

export default async function AccountPage(){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) redirect('/login')

  const admin = getAdminSupabase()
  const { data: ur } = await admin.from('user_roles').select('role_id').eq('user_id', session.user.id)
  const roleIds = (ur || []).map((r: any) => r.role_id)
  const { data: roles } = await admin.from('roles').select('name').in('id', roleIds)
  const roleNames = (roles || []).map((r: any) => r.name)

  return (
    <div className="pt-24">
      <h2 className="text-2xl font-semibold">Account</h2>
      <p className="mt-2">Email: {session.user.email}</p>
      <p className="mt-2">Roles: {roleNames.join(', ') || '—'}</p>
      <div className="mt-4"><a href="/api/auth/signout" className="text-primary">Logout</a></div>
    </div>
  )
}
