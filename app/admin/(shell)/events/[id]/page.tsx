export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAnyPermission, getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { getEventById } from '../../../../../lib/events-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel } from '../../../../../components/admin/Panel'
import StatusBadge from '../../../../../components/admin/StatusBadge'
import EventDetailActions from '../../../../../components/admin/EventDetailActions'

export default async function AdminEventDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['events.view'])
  const canEdit = hasPermission(permissions, 'events.edit')
  const canDelete = hasPermission(permissions, 'events.delete')

  const event = await getEventById(params.id)
  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader title="Event not found" />
        <Panel><p className="py-10 text-center text-sm text-gray-500">This event does not exist or was deleted.</p></Panel>
      </div>
    )
  }

  const categoryName = (event as any).category?.name_en ?? null
  const status = (event.status as string) || (event.published ? 'published' : 'draft')

  const rows: { label: string; value: string }[] = [
    { label: 'Slug', value: event.slug || '—' },
    { label: 'Category', value: categoryName || '—' },
    { label: 'Date', value: event.date ? new Date(event.date).toLocaleDateString() : '—' },
    { label: 'Time', value: event.time?.slice(0, 5) || '—' },
    { label: 'Location', value: event.location || '—' },
    { label: 'Capacity', value: event.capacity ? String(event.capacity) : '—' },
    { label: 'Registration deadline', value: event.registration_deadline ? new Date(event.registration_deadline).toLocaleString() : '—' },
    { label: 'Featured', value: event.featured ? 'Yes' : 'No' },
    { label: 'Created', value: event.created_at ? new Date(event.created_at).toLocaleDateString() : '—' }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.title_en}
        description={event.description_en || 'No description provided.'}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={status === 'published' ? 'success' : status === 'archived' ? 'neutral' : 'warning'}>{status === 'published' ? 'Published' : status === 'archived' ? 'Archived' : 'Draft'}</StatusBadge>
            {canEdit && (
              <>
                <Link href={`/admin/events/${params.id}/edit`} className="btn btn-primary btn-sm">Edit Event</Link>
                <EventDetailActions event={event as any} canDelete={canDelete} />
              </>
            )}
          </div>
        }
      />

      <Panel title="Details">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label}>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">{row.label}</p>
              <p className="mt-1 text-sm text-white">{row.value}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex justify-end">
        <Link href="/admin/events" className="btn btn-ghost btn-sm">Back to Events</Link>
      </div>
    </div>
  )
}