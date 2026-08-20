export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../../../../lib/auth'
import { hasPermission } from '../../../../../../../lib/permissions'
import { getAlbum } from '../../../../../../../lib/albums-server'
import PageHeader from '../../../../../../../components/admin/PageHeader'
import { Panel, ErrorState } from '../../../../../../../components/admin/Panel'
import AlbumForm from '../../../../../../../components/admin/AlbumForm'

export default async function AdminAlbumEditPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['media.manage'])
  const canEdit = hasPermission(permissions, 'media.manage')

  const album = await getAlbum(params.id)
  if (!album) {
    return (
      <div className="space-y-6">
        <PageHeader title="Album not found" />
        <Panel><ErrorState message="This album does not exist or was deleted." /></Panel>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Album" description="Update album details and publication status." />
      <Panel><AlbumForm album={album} canEdit={canEdit} /></Panel>
    </div>
  )
}