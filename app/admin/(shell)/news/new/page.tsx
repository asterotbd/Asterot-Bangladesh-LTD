export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../../lib/supabaseServer'
import { requirePermission } from '../../../../../lib/auth'
import { getNewsCategories } from '../../../../../lib/news-server'
import AdminNewsForm from '../../../../../components/AdminNewsForm'

export default async function AdminNewsNewPage(){
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'news.create')

  const categories = await getNewsCategories()

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">New News Article</h1>
      <AdminNewsForm categories={categories as any[]} />
    </div>
  )
}