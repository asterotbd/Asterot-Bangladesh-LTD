export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requirePermission, getCurrentUser } from '../../../../../lib/auth'
import { getEventCategories } from '../../../../../lib/events-server'
import AdminEventForm from '../../../../../components/AdminEventForm'

export default async function AdminEventNewPage(){
  const user = await getCurrentUser()
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