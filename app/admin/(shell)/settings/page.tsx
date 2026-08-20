export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireAnyPermission, getCurrentUser } from '../../../../lib/auth'
import { listSettings } from '../../../../lib/settings-server'
import PageHeader from '../../../../components/admin/PageHeader'
import { Panel, EmptyState, ErrorState } from '../../../../components/admin/Panel'
import SettingsForm from '../../../../components/admin/SettingsForm'

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['settings.view'])
  const canManage = permissions.includes('settings.manage')

  let settings: Awaited<ReturnType<typeof listSettings>> | null = null
  let failed = false
  try {
    settings = await listSettings()
  } catch (err) {
    console.error('Admin settings list error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Site-wide key/value settings. Only safe administrative settings are shown."
      />

      {failed ? (
        <Panel><ErrorState message="Unable to load settings." /></Panel>
      ) : !settings || settings.length === 0 ? (
        <Panel>
          <EmptyState message="No settings configured yet." />
          {canManage && (
            <div className="flex justify-center pb-8">
              <SettingsForm settings={[]} canManage={canManage} />
            </div>
          )}
        </Panel>
      ) : (
        <SettingsForm settings={settings} canManage={canManage} />
      )}
    </div>
  )
}