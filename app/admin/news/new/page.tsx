export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../lib/supabaseServer'
import { getUserRoles } from '../../../../lib/auth'
import { getNewsCategories, NEWS_ADMIN_ROLES } from '../../../../lib/news-server'
import AdminNewsForm from '../../../../components/AdminNewsForm'

export default async function AdminNewsNewPage(){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) redirect('/admin/login')
  const roles = await getUserRoles(session.user.id)
  if (!roles.some((r: any) => NEWS_ADMIN_ROLES.includes(String(r)))) redirect('/account')

  const categories = await getNewsCategories()

  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold mb-6">New News Article</h1>
      <AdminNewsForm categories={categories as any[]} />
    </div>
  )
}
