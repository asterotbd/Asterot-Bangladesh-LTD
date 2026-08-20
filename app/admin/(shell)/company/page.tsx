export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requirePermission, getCurrentUser } from '../../../../lib/auth'
import AdminCompanyForm from '../../../../components/AdminCompanyForm'

export default async function AdminCompanyPage(){
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'company.edit')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Company — Content</h1>
      <AdminCompanyForm />
    </div>
  )
}