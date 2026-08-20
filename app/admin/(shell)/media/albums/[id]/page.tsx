export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../../../lib/auth'
import { hasPermission } from '../../../../../../lib/permissions'
import { getAlbum, listAlbumPhotos } from '../../../../../../lib/albums-server'
import PageHeader from '../../../../../../components/admin/PageHeader'
import { Panel, ErrorState } from '../../../../../../components/admin/Panel'
import StatusBadge from '../../../../../../components/admin/StatusBadge'
import AlbumEditor from '../../../../../../components/admin/AlbumEditor'

export default async function AdminAlbumDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['media.view'])
  const canEdit = hasPermission(permissions, 'media.manage')

  let album: Awaited<ReturnType<typeof getAlbum>> = null
  let photos: Awaited<ReturnType<typeof listAlbumPhotos>> = []
  let failed = false
  try {
    ;[album, photos] = await Promise.all([getAlbum(params.id), listAlbumPhotos(params.id)])
  } catch (err) {
    console.error('Admin album detail load error', err)
    failed = true
  }

  if (failed) {
    return <Panel><ErrorState message="Unable to load the album." /></Panel>
  }

  if (!album) {
    return (
      <div className="space-y-6">
        <PageHeader title="Album not found" />
        <Panel><p className="py-10 text-center text-sm text-gray-500">This album does not exist or was deleted.</p></Panel>
      </div>
    )
  }

  const status = album.published ? 'published' : 'draft'

  return (
    <div className="space-y-6">
      <PageHeader
        title={album.title_en || 'Untitled album'}
        description={album.description_en || 'No description.'}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={status === 'published' ? 'success' : 'warning'}>{status === 'published' ? 'Published' : 'Draft'}</StatusBadge>
            {canEdit && <Link href={`/admin/media/albums/${params.id}/edit`} className="btn btn-primary btn-sm">Edit Details</Link>}
          </div>
        }
      />

      <Panel title={`Photos (${photos.length})`}>
        <AlbumEditor albumId={params.id} coverMediaId={album.cover_media_id} photos={photos} canEdit={canEdit} />
      </Panel>

      <div className="flex justify-end">
        <Link href="/admin/media/albums" className="btn btn-ghost btn-sm">Back to Albums</Link>
      </div>
    </div>
  )
}