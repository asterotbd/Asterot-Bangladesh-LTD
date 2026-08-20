export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireAnyPermission, getCurrentUser } from '../../../../../../lib/auth'
import { hasPermission } from '../../../../../../lib/permissions'
import PageHeader from '../../../../../../components/admin/PageHeader'
import { Panel } from '../../../../../../components/admin/Panel'
import AlbumForm from '../../../../../../components/admin/AlbumForm'

export default async function AdminNewAlbumPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['media.manage'])
  const canEdit = hasPermission(permissions, 'media.manage')

  return (
    <div className="space-y-6">
      <PageHeader title="New Album" description="Create a photo album for the media gallery." />
      <Panel><AlbumForm canEdit={canEdit} /></Panel>
    </div>
  )
}