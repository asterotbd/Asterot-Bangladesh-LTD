export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../../lib/supabaseServer'
import { getUserRoles } from '../../../../../lib/auth'
import { getNewsById, getNewsCategories, NEWS_ADMIN_ROLES } from '../../../../../lib/news-server'
import AdminNewsForm from '../../../../../components/AdminNewsForm'

export default async function AdminNewsEditPage({ params }: { params: { id: string } }){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) redirect('/admin/login')
  const roles = await getUserRoles(session.user.id)
  if (!roles.some((r: any) => NEWS_ADMIN_ROLES.includes(String(r)))) redirect('/account')

  const [news, categories] = await Promise.all([getNewsById(params.id), getNewsCategories()])

  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold mb-6">Edit News</h1>
      {news ? (
        <AdminNewsForm news={news as any} categories={categories as any[]} />
      ) : (
        <p className="text-gray-400">News article not found.</p>
      )}
    </div>
  )
}
