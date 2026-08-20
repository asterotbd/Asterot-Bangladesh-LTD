export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../lib/auth'
import { listAuditLogs, AUDIT_ACTIONS } from '../../../../lib/activity-server'
import PageHeader from '../../../../components/admin/PageHeader'
import Pagination from '../../../../components/admin/Pagination'
import { Panel, EmptyState, ErrorState } from '../../../../components/admin/Panel'

const ACTION_LABELS: Record<string, string> = {
  'user_roles.assign': 'Role assigned',
  'user_roles.remove': 'Role removed',
  'contact.status': 'Message status changed',
  'media.upload': 'Media uploaded',
  'media.update': 'Media updated',
  'media.delete': 'Media deleted',
  'settings.update': 'Settings updated',
  'settings.delete': 'Setting deleted',
  'roles.update': 'Role updated'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function actionLabel(action: string | null): string {
  return action ? (ACTION_LABELS[action] ?? action) : '—'
}

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return ''
  const parts: string[] = []
  for (const [key, value] of Object.entries(meta)) {
    parts.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
  }
  return parts.join(' · ')
}

export default async function AdminActivityPage({ searchParams }: { searchParams: { page?: string; q?: string; action?: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  await requireAnyPermission(user.id, ['activity.view'])

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const q = (searchParams.q ?? '').trim()
  const actionParam = (searchParams.action ?? '').trim()
  const action = (AUDIT_ACTIONS as readonly string[]).includes(actionParam) ? actionParam : ''

  let result: Awaited<ReturnType<typeof listAuditLogs>> | null = null
  let failed = false
  try {
    result = await listAuditLogs({ page, perPage: 20, action, search: q })
  } catch (err) {
    console.error('Admin activity list error', err)
    failed = true
  }

  const baseUrl = `/admin/activity${q ? `?q=${encodeURIComponent(q)}` : ''}${action ? `${q ? '&' : '?'}action=${action}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="A record of important administrative actions."
      />

      <form method="get" action="/admin/activity" className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by resource"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Action</span>
          <select
            name="action"
            defaultValue={action}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((value) => (
              <option key={value} value={value}>
                {ACTION_LABELS[value] ?? value}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Filter</button>
        {(q || action) && (
          <Link href="/admin/activity" className="btn btn-ghost">Clear</Link>
        )}
      </form>

      {failed ? (
        <Panel><ErrorState message="Unable to load activity logs." /></Panel>
      ) : !result || result.logs.length === 0 ? (
        <Panel><EmptyState message="No activity recorded yet." /></Panel>
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-gray-400">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {result.logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{actionLabel(log.action)}</td>
                    <td className="px-4 py-3 text-gray-300">{log.actor_email || 'System'}</td>
                    <td className="px-4 py-3 text-gray-400">{log.resource || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="block max-w-[22rem] truncate" title={formatMeta(log.meta)}>{formatMeta(log.meta) || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {result && <Pagination page={page} totalPages={result.totalPages} baseUrl={baseUrl} />}
    </div>
  )
}