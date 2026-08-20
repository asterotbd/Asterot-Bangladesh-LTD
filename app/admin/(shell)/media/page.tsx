export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAnyPermission, getCurrentUser } from '../../../../lib/auth'
import { listMedia, MEDIA_TYPES } from '../../../../lib/media-server'
import PageHeader from '../../../../components/admin/PageHeader'
import Pagination from '../../../../components/admin/Pagination'
import { Panel, EmptyState, ErrorState } from '../../../../components/admin/Panel'
import MediaUploader from '../../../../components/admin/MediaUploader'
import MediaGrid from '../../../../components/admin/MediaGrid'

export default async function AdminMediaPage({ searchParams }: { searchParams: { page?: string; q?: string; type?: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['media.view'])
  const canManage = permissions.includes('media.manage')

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const q = (searchParams.q ?? '').trim()
  const typeParam = (searchParams.type ?? '').trim()
  const type = (MEDIA_TYPES as readonly string[]).includes(typeParam) ? typeParam : ''

  let result: Awaited<ReturnType<typeof listMedia>> | null = null
  let failed = false
  try {
    result = await listMedia({ page, perPage: 24, search: q, type })
  } catch (err) {
    console.error('Admin media list error', err)
    failed = true
  }

  const baseUrl = `/admin/media${q ? `?q=${encodeURIComponent(q)}` : ''}${type ? `${q ? '&' : '?'}type=${type}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media"
        description="Uploaded files and media references used across the website."
        actions={canManage ? <MediaUploader /> : undefined}
      />

      <form method="get" action="/admin/media" className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by alt text, caption, or category"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Type</span>
          <select
            name="type"
            defaultValue={type}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          >
            <option value="">All types</option>
            {MEDIA_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Filter</button>
        {(q || type) && (
          <Link href="/admin/media" className="btn btn-ghost">Clear</Link>
        )}
      </form>

      {failed ? (
        <Panel><ErrorState message="Unable to load media." /></Panel>
      ) : !result || result.items.length === 0 ? (
        <Panel>
          <EmptyState message={q || type ? 'No media match your filters.' : 'No media yet.'} />
        </Panel>
      ) : (
        <MediaGrid items={result.items} canManage={canManage} />
      )}

      {result && <Pagination page={page} totalPages={result.totalPages} baseUrl={baseUrl} />}
    </div>
  )
}