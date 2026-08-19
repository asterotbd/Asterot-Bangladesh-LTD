export const dynamic = 'force-dynamic'
import createServerClient from '../../lib/supabaseServer'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import getAdminSupabase from '../../lib/supabaseAdmin'
import LogoutButton from '../../components/LogoutButton'

export default async function AccountPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }){
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdminSupabase()
  const { data: ur } = await admin.from('user_roles').select('role_id').eq('user_id', user.id)
  const roleIds = (ur || []).map((r: any) => r.role_id)
  const { data: roles } = await admin.from('roles').select('name').in('id', roleIds)
  const roleNames = (roles || []).map((r: any) => r.name)

  const deniedAdminAccess = searchParams?.notice === 'admin_access_denied'

  return (
    <main className="container py-20">
      {deniedAdminAccess && (
        <div role="status" className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Signed in, but your account does not have access to the Asterot administration area. If you believe this is an error, please contact the Asterot team.
        </div>
      )}
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="mt-2">Email: {user.email}</p>
      <p className="mt-2">Roles: {roleNames.join(', ') || '—'}</p>
      <div className="mt-4"><LogoutButton className="text-primary" /></div>
    </main>
  )
}
