export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../lib/supabaseServer'
import { requirePermission } from '../../../../lib/auth'
import { getAllEvents } from '../../../../lib/events-server'
import { Panel, ErrorState } from '../../../../components/admin/Panel'
import AdminEventsTable from '../../../../components/admin/AdminEventsTable'

export default async function AdminEventsPage(){
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'events.view')

  let events: Awaited<ReturnType<typeof getAllEvents>> = []
  let failed = false
  try {
    events = await getAllEvents()
  } catch (err) {
    console.error('Admin events list load error', err)
    failed = true
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Events</h1>
        <Link href="/admin/events/new" className="btn btn-primary">New Event</Link>
      </div>

      {failed ? (
        <Panel><ErrorState message="Unable to load events. Please try again." /></Panel>
      ) : events.length === 0 ? (
        <p className="text-gray-400">No events yet. Create your first event.</p>
      ) : (
        <AdminEventsTable events={events as any[]} />
      )}
    </div>
  )
}