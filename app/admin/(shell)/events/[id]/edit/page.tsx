export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../../../lib/supabaseServer'
import { requirePermission } from '../../../../../../lib/auth'
import { getEventById, getEventCategories } from '../../../../../../lib/events-server'
import AdminEventForm from '../../../../../../components/AdminEventForm'

export default async function AdminEventEditPage({ params }: { params: { id: string } }){
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
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