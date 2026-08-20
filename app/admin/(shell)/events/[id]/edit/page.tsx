export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requirePermission, getCurrentUser } from '../../../../../../lib/auth'
import { getEventById, getEventCategories } from '../../../../../../lib/events-server'
import AdminEventForm from '../../../../../../components/AdminEventForm'

export default async function AdminEventEditPage({ params }: { params: { id: string } }){
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'events.edit')

  const [event, categories] = await Promise.all([getEventById(params.id), getEventCategories()])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Edit Event</h1>
      {event ? (
        <AdminEventForm event={event as any} categories={categories as any[]} />
      ) : (
        <p className="text-gray-400">Event not found.</p>
      )}
    </div>
  )
}