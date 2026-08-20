export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../lib/auth'
import { listContactMessages, CONTACT_STATUSES } from '../../../../lib/contact-server'
import PageHeader from '../../../../components/admin/PageHeader'
import StatusBadge from '../../../../components/admin/StatusBadge'
import Pagination from '../../../../components/admin/Pagination'
import { EmptyState, ErrorState, Panel } from '../../../../components/admin/Panel'
import ContactMessageActions from '../../../../components/admin/ContactMessageActions'

const STATUS_TONE: Record<string, { tone: 'success' | 'warning' | 'info' | 'neutral' | 'primary'; label: string }> = {
  new: { tone: 'warning', label: 'New' },
  read: { tone: 'info', label: 'Read' },
  handled: { tone: 'success', label: 'Handled' },
  archived: { tone: 'neutral', label: 'Archived' }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function AdminMessagesPage({ searchParams }: { searchParams: { page?: string; q?: string; status?: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['contact.view'])
  const canManage = permissions.includes('contact.manage')

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const q = (searchParams.q ?? '').trim()
  const statusParam = (searchParams.status ?? '').trim()
  const status = (CONTACT_STATUSES as readonly string[]).includes(statusParam) ? statusParam : ''

  let result: Awaited<ReturnType<typeof listContactMessages>> | null = null
  let failed = false
  try {
    result = await listContactMessages({ page, perPage: 20, search: q, status })
  } catch (err) {
    console.error('Admin messages list error', err)
    failed = true
  }

  const baseUrl = `/admin/messages${q ? `?q=${encodeURIComponent(q)}` : ''}${status ? `${q ? '&' : '?'}status=${status}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Messages"
        description="Incoming inquiries from the public contact form."
      />

      <form method="get" action="/admin/messages" className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, email, or subject"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          >
            <option value="">All statuses</option>
            {CONTACT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_TONE[value].label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Filter</button>
        {(q || status) && (
          <Link href="/admin/messages" className="btn btn-ghost">Clear</Link>
        )}
      </form>

      {result && result.messages.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {result.messages.length} of {result.total} message{result.total === 1 ? '' : 's'}
        </p>
      )}

      {failed ? (
        <Panel><ErrorState message="Unable to load contact messages." /></Panel>
      ) : !result || result.messages.length === 0 ? (
        <Panel>
          <EmptyState message={q || status ? 'No messages match your filters.' : 'No contact messages yet.'} />
        </Panel>
      ) : (
        <Panel>
          <div className="space-y-3">
            {result.messages.map((message) => {
              const statusInfo = STATUS_TONE[message.status ?? ''] ?? STATUS_TONE.new
              return (
                <div key={message.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{message.name || 'Anonymous'}</p>
                      <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">
                      {message.email || 'No email'} {message.subject ? `· ${message.subject}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{message.message || 'No message body.'}</p>
                    <p className="mt-1 text-xs text-gray-600">{formatDate(message.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canManage && (
                      <ContactMessageActions messageId={message.id} currentStatus={message.status ?? 'new'} />
                    )}
                    <Link href={`/admin/messages/${message.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                      Open
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      {result && <Pagination page={page} totalPages={result.totalPages} baseUrl={baseUrl} />}
    </div>
  )
}