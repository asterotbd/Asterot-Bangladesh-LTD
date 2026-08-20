export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAnyPermission, getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { getNewsById } from '../../../../../lib/news-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel } from '../../../../../components/admin/Panel'
import StatusBadge from '../../../../../components/admin/StatusBadge'
import NewsDetailActions from '../../../../../components/admin/NewsDetailActions'

export default async function AdminNewsDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['news.view'])
  const canEdit = hasPermission(permissions, 'news.edit')
  const canDelete = hasPermission(permissions, 'news.delete')

  const article = await getNewsById(params.id)
  if (!article) {
    return (
      <div className="space-y-6">
        <PageHeader title="Article not found" />
        <Panel><p className="py-10 text-center text-sm text-gray-500">This article does not exist or was deleted.</p></Panel>
      </div>
    )
  }

  const status = (article.status as string) || (article.published ? 'published' : 'draft')

  const rows: { label: string; value: string }[] = [
    { label: 'Slug', value: article.slug || '—' },
    { label: 'Excerpt', value: article.excerpt_en || '—' },
    { label: 'Published at', value: article.published_at ? new Date(article.published_at).toLocaleString() : '—' },
    { label: 'Created', value: article.created_at ? new Date(article.created_at).toLocaleString() : '—' },
    { label: 'Last updated', value: article.updated_at ? new Date(article.updated_at).toLocaleString() : '—' }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={article.title_en}
        description={article.subtitle_en || 'No subtitle provided.'}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={status === 'published' ? 'success' : status === 'archived' ? 'neutral' : 'warning'}>{status === 'published' ? 'Published' : status === 'archived' ? 'Archived' : 'Draft'}</StatusBadge>
            {canEdit && (
              <>
                <Link href={`/admin/news/${params.id}/edit`} className="btn btn-primary btn-sm">Edit Article</Link>
                <NewsDetailActions article={article} canDelete={canDelete} />
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

      {(article.content_en || article.content_bn) && (
        <Panel title="Content Preview">
          <div className="prose prose-invert max-w-none text-sm text-gray-300">
            {(article.content_en ?? article.content_bn ?? '').split(/\n\s*\n/).map((p, i) => (
              <p key={i} className="mb-3">{p}</p>
            ))}
          </div>
        </Panel>
      )}

      <div className="flex justify-end">
        <Link href="/admin/news" className="btn btn-ghost btn-sm">Back to News</Link>
      </div>
    </div>
  )
}