export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { listFaq, getFaqCategories } from '../../../../../lib/faq-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel, ErrorState, EmptyState } from '../../../../../components/admin/Panel'
import FaqForm from '../../../../../components/admin/FaqForm'

export default async function AdminFaqPage({ searchParams }: { searchParams: { page?: string; q?: string; status?: string; category?: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['content.view'])
  const canEdit = hasPermission(permissions, 'content.edit')

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const q = (searchParams.q ?? '').trim()
  const status = (searchParams.status ?? '').trim()
  const category = (searchParams.category ?? '').trim()

  let result: Awaited<ReturnType<typeof listFaq>> | null = null
  let categories: string[] = []
  let failed = false
  try {
    ;[result, categories] = await Promise.all([
      listFaq({ page, perPage: 50, search: q, status, category }),
      getFaqCategories()
    ])
  } catch (err) {
    console.error('Admin FAQ load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQ"
        description="Manage the questions and answers shown on the public FAQ page."
      />

      <form method="get" action="/admin/content/faq" className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search questions and answers"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Status</span>
          <select name="status" defaultValue={status} className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        {categories.length > 0 && (
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Category</span>
            <select name="category" defaultValue={category} className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25">
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className="btn btn-primary">Filter</button>
        {(q || status || category) && (
          <a href="/admin/content/faq" className="text-sm font-medium text-gray-400 underline-offset-4 hover:text-gray-200 hover:underline">
            Clear
          </a>
        )}
      </form>

      {failed ? (
        <Panel><ErrorState message="Unable to load FAQ items." /></Panel>
      ) : !result ? (
        <Panel><ErrorState message="Unable to load FAQ items." /></Panel>
      ) : (
        <>
          {result.items.length === 0 && (
            <Panel><EmptyState message="No FAQ items match your filters. Use the button above to add one." /></Panel>
          )}
          <FaqForm items={result.items} categories={categories} canEdit={canEdit} />
        </>
      )}
    </div>
  )
}