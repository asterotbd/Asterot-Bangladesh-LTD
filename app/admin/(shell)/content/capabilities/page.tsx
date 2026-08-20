export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireAnyPermission, getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { listServices } from '../../../../../lib/services-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel, ErrorState, EmptyState } from '../../../../../components/admin/Panel'
import CapabilitiesForm from '../../../../../components/admin/CapabilitiesForm'

export default async function AdminCapabilitiesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['content.view'])
  const canEdit = hasPermission(permissions, 'content.edit')

  let services: Awaited<ReturnType<typeof listServices>> = []
  let failed = false
  try {
    services = await listServices()
  } catch (err) {
    console.error('Admin capabilities load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capabilities"
        description="Manage the capability cards shown on the homepage and across the site."
      />

      {failed ? (
        <Panel><ErrorState message="Unable to load capabilities." /></Panel>
      ) : (
        <>
          {services.length === 0 && (
            <Panel><EmptyState message="No capabilities yet. Create one below." /></Panel>
          )}
          <CapabilitiesForm services={services} canEdit={canEdit} />
        </>
      )}
    </div>
  )
}