import { redirect } from 'next/navigation'
import { getUserRoles } from '../../../lib/auth'
import createServerClient from '../../../lib/supabaseServer'
import AdminCompanyForm from '../../../components/AdminCompanyForm'

export const dynamic = 'force-dynamic'

export default async function AdminCompanyPage(){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) redirect('/admin/login')
  const roles = await getUserRoles(session.user.id)
  if (!roles.some(r=>['super_admin','admin'].includes(r))) redirect('/account')

  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold mb-4">Company — Content</h1>
      <AdminCompanyForm />
    </div>
  )
}
