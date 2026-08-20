export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requirePermission, getCurrentUser } from '../../../../../../lib/auth'
import { getNewsById, getNewsCategories } from '../../../../../../lib/news-server'
import AdminNewsForm from '../../../../../../components/AdminNewsForm'

export default async function AdminNewsEditPage({ params }: { params: { id: string } }){
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'news.edit')

  const [news, categories] = await Promise.all([getNewsById(params.id), getNewsCategories()])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Edit News</h1>
      {news ? (
        <AdminNewsForm news={news as any} categories={categories as any[]} />
      ) : (
        <p className="text-gray-400">News article not found.</p>
      )}
    </div>
  )
}