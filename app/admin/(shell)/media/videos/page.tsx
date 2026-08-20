export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireAnyPermission, getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { listVideos } from '../../../../../lib/videos-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel, ErrorState, EmptyState } from '../../../../../components/admin/Panel'
import VideosManager from '../../../../../components/admin/VideosManager'

export default async function AdminVideosPage({ searchParams }: { searchParams: { page?: string; status?: string; q?: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['media.view'])
  const canPublish = hasPermission(permissions, 'media.manage')
  const canDelete = hasPermission(permissions, 'media.manage')

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const status = (searchParams.status ?? '').trim()
  const q = (searchParams.q ?? '').trim()

  let result: Awaited<ReturnType<typeof listVideos>> | null = null
  let failed = false
  try {
    result = await listVideos({ page, perPage: 24, search: q, status })
  } catch (err) {
    console.error('Admin videos load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        description="Manage the YouTube videos synced from the channel. Control visibility with publish toggles."
      />

      <form method="get" action="/admin/media/videos" className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search captions and categories"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Status</span>
          <select name="status" defaultValue={status} className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Hidden</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Filter</button>
      </form>

      {failed ? (
        <Panel><ErrorState message="Unable to load videos." /></Panel>
      ) : !result || result.items.length === 0 ? (
        <Panel><EmptyState message="No videos yet. Videos appear here after they are synced from the YouTube channel." /></Panel>
      ) : (
        <VideosManager videos={result.items} canPublish={canPublish} canDelete={canDelete} />
      )}
    </div>
  )
}