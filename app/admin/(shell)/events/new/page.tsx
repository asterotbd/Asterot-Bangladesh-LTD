export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../../lib/supabaseServer'
import { requirePermission } from '../../../../../lib/auth'
import { getEventCategories } from '../../../../../lib/events-server'
import AdminEventForm from '../../../../../components/AdminEventForm'

export default async function AdminEventNewPage(){
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'events.create')

  const categories = await getEventCategories()

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">New Event</h1>
      <AdminEventForm categories={categories as any[]} />
    </div>
  )
}