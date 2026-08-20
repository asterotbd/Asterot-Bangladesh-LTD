export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { listAlbums } from '../../../../../lib/albums-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel, ErrorState, EmptyState } from '../../../../../components/admin/Panel'
import AlbumsManager from '../../../../../components/admin/AlbumsManager'

export default async function AdminAlbumsPage({ searchParams }: { searchParams: { page?: string; status?: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['media.view'])
  const canEdit = hasPermission(permissions, 'media.manage')
  const canDelete = hasPermission(permissions, 'media.manage')

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const status = (searchParams.status ?? '').trim()

  let result: Awaited<ReturnType<typeof listAlbums>> | null = null
  let failed = false
  try {
    result = await listAlbums({ page, perPage: 24, status })
  } catch (err) {
    console.error('Admin albums load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photo Albums"
        description="Organize photos into galleries shown on the public media pages."
        actions={canEdit ? <Link href="/admin/media/albums/new" className="btn btn-primary btn-sm">New Album</Link> : undefined}
      />

      <form method="get" action="/admin/media/albums" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Status</span>
          <select name="status" defaultValue={status} className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Filter</button>
      </form>

      {failed ? (
        <Panel><ErrorState message="Unable to load albums." /></Panel>
      ) : !result || result.items.length === 0 ? (
        <Panel><EmptyState message="No albums yet. Create one to start organizing photos." /></Panel>
      ) : (
        <AlbumsManager albums={result.items} canEdit={canEdit} canDelete={canDelete} />
      )}
    </div>
  )
}