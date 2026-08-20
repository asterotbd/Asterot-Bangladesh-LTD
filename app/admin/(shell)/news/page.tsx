export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requirePermission, getCurrentUser } from '../../../../lib/auth'
import { listNews } from '../../../../lib/news-server'
import PageHeader from '../../../../components/admin/PageHeader'
import Pagination from '../../../../components/admin/Pagination'
import { Panel, ErrorState } from '../../../../components/admin/Panel'
import AdminNewsTable from '../../../../components/admin/AdminNewsTable'

export default async function AdminNewsPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  await requirePermission(user.id, 'news.view')

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1

  let result: Awaited<ReturnType<typeof listNews>> | null = null
  let failed = false
  try {
    result = await listNews({ page, perPage: 20 })
  } catch (err) {
    console.error('Admin news list load error', err)
    failed = true
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">News</h1>
        <Link href="/admin/news/new" className="btn btn-primary">New News</Link>
      </div>

      {failed ? (
        <Panel><ErrorState message="Unable to load news. Please try again." /></Panel>
      ) : !result || result.items.length === 0 ? (
        <p className="text-gray-400">No news yet. Create your first news article.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Showing {result.items.length} of {result.total} article{result.total === 1 ? '' : 's'}
          </p>
          <AdminNewsTable news={result.items as any[]} />
          <div className="mt-6">
            <Pagination page={page} totalPages={result.totalPages} baseUrl="/admin/news" />
          </div>
        </>
      )}
    </div>
  )
}