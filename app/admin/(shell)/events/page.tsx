export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requirePermission, getCurrentUser } from '../../../../lib/auth'
import { listEvents } from '../../../../lib/events-server'
import PageHeader from '../../../../components/admin/PageHeader'
import Pagination from '../../../../components/admin/Pagination'
import { Panel, ErrorState } from '../../../../components/admin/Panel'
import AdminEventsTable from '../../../../components/admin/AdminEventsTable'

export default async function AdminEventsPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'events.view')

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1

  let result: Awaited<ReturnType<typeof listEvents>> | null = null
  let failed = false
  try {
    result = await listEvents({ page, perPage: 20 })
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
      ) : !result || result.items.length === 0 ? (
        <p className="text-gray-400">No events yet. Create your first event.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Showing {result.items.length} of {result.total} event{result.total === 1 ? '' : 's'}
          </p>
          <AdminEventsTable events={result.items as any[]} />
          <div className="mt-6">
            <Pagination page={page} totalPages={result.totalPages} baseUrl="/admin/events" />
          </div>
        </>
      )}
    </div>
  )
}