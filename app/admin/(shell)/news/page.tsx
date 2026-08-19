export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../lib/supabaseServer'
import { requirePermission } from '../../../../lib/auth'
import { getAllNews } from '../../../../lib/news-server'
import AdminNewsTable from '../../../../components/admin/AdminNewsTable'

export default async function AdminNewsPage(){
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'news.view')

  const news = await getAllNews()

  return (
    <div>
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