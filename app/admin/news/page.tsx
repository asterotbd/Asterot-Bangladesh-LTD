export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../lib/supabaseServer'
import { getUserRoles } from '../../../lib/auth'
import { getAllNews, NEWS_ADMIN_ROLES } from '../../../lib/news-server'
import AdminNewsTable from '../../../components/admin/AdminNewsTable'

export default async function AdminNewsPage(){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) redirect('/admin/login')
  const roles = await getUserRoles(session.user.id)
  if (!roles.some((r: any) => NEWS_ADMIN_ROLES.includes(String(r)))) redirect('/account')

  const news = await getAllNews()

  return (
    <div className="py-16">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">News</h1>
        <Link href="/admin/news/new" className="btn btn-primary">New News</Link>
      </div>

      {news.length === 0 ? (
        <p className="text-gray-400">No news yet. Create your first news article.</p>
      ) : (
        <AdminNewsTable news={news as any[]} />
      )}
    </div>
  )
}
