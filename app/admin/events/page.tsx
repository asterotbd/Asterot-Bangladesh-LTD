export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../lib/supabaseServer'
import { getUserRoles } from '../../../lib/auth'
import { getAllEvents, EVENT_ADMIN_ROLES } from '../../../lib/events-server'
import AdminEventsTable from '../../../components/admin/AdminEventsTable'

export default async function AdminEventsPage(){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) redirect('/admin/login')
  const roles = await getUserRoles(session.user.id)
  if (!roles.some((r: any) => EVENT_ADMIN_ROLES.includes(String(r)))) redirect('/account')

  const events = await getAllEvents()

  return (
    <div className="py-16">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Events</h1>
        <Link href="/admin/events/new" className="btn btn-primary">New Event</Link>
      </div>

      {events.length === 0 ? (
        <p className="text-gray-400">No events yet. Create your first event.</p>
      ) : (
        <AdminEventsTable events={events as any[]} />
      )}
    </div>
  )
}
