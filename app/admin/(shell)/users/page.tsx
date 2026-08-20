export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../lib/auth'
import { listUsers, listRoles, type AdminRole, type UserListResult } from '../../../../lib/users-server'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  editor: 'Editor',
  coach: 'Coach',
  finance: 'Finance'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function identity(user: { display_name: string | null; full_name: string | null; email: string | null }): string {
  if (user.display_name) return user.display_name
  if (user.full_name) return user.full_name
  if (user.email) return user.email.split('@')[0] || 'Member'
  return 'Member'
}

function initialsOf(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || '?'
}

function roleLabel(name: string): string {
  return ROLE_LABELS[name] || name
}

function EmailBadge({ email, confirmedAt }: { email: string | null; confirmedAt: string | null }) {
  if (!email) {
    return <span className="text-sm text-gray-500">—</span>
  }
  if (confirmedAt) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
        Confirmed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
      Unconfirmed
    </span>
  )
}

function buildPageHref(base: string, page: number): string {
  return `${base}${base.includes('?') ? '&' : '?'}page=${page}`
}

function buildPageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const window: (number | 'ellipsis')[] = [1]
  if (current - 2 > 2) window.push('ellipsis')
  for (let n = Math.max(2, current - 2); n <= Math.min(total - 1, current + 2); n++) window.push(n)
  if (current + 2 < total - 1) window.push('ellipsis')
  window.push(total)
  return window
}

function Pagination({ page, totalPages, baseUrl }: { page: number; totalPages: number; baseUrl: string }) {
  if (totalPages <= 1) return null
  const pageClass = 'inline-flex min-w-9 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors'
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={buildPageHref(baseUrl, page - 1)} className={`${pageClass} border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10`}>
          Previous
        </Link>
      )}
      {buildPageWindow(page, totalPages).map((entry, index) =>
        entry === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm text-gray-500">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildPageHref(baseUrl, entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={`${pageClass} ${
              entry === page
                ? 'bg-primary text-white'
                : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {entry}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={buildPageHref(baseUrl, page + 1)} className={`${pageClass} border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10`}>
          Next
        </Link>
      )}
    </nav>
  )
}

export default async function AdminUsersPage({ searchParams }: { searchParams: { page?: string; q?: string; role?: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['users.view'])

  const rawPage = Number.parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const q = (searchParams.q ?? '').trim()
  const roleParam = (searchParams.role ?? '').trim()

  let roles: AdminRole[] = []
  let roleId: string | null = null
  try {
    roles = await listRoles()
    if (roleParam && roles.some((role) => role.id === roleParam)) roleId = roleParam
  } catch (err) {
    console.error('Admin users role list error', err)
  }

  let result: UserListResult | null = null
  try {
    result = await listUsers({ page, perPage: 20, search: q, roleId })
  } catch (err) {
    console.error('Admin users list error', err)
  }

  const baseUrl = `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}${roleId ? `${q ? '&' : '?'}role=${roleId}` : ''}`

  let emptyMessage: string | null = null
  let displayPage = page
  if (result && result.users.length === 0) {
    displayPage = Math.min(page, result.totalPages)
    emptyMessage = result.total === 0
      ? q
        ? 'No users match your search'
        : roleId
          ? 'No users have this role'
          : 'No users found'
      : 'No users found'
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-gray-400">Manage user accounts and profile information.</p>
      </header>

      <form method="get" action="/admin/users" className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[12rem]">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Role</span>
          <select
            name="role"
            defaultValue={roleParam}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {roleLabel(role.name)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Filter</button>
        {(q || roleId) && (
          <Link href="/admin/users" className="btn btn-ghost">Clear</Link>
        )}
      </form>

      {result && result.users.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {result.users.length} of {result.total} user{result.total === 1 ? '' : 's'}
        </p>
      )}

      {result === null ? (
        <div className="rounded-2xl border border-white/10 bg-panel">
          <p className="py-16 text-center text-sm text-amber-200/80">Unable to load users.</p>
        </div>
      ) : result.users.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-panel">
          <p className="py-16 text-center text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-panel">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-gray-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Email Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.users.map((user) => {
                const name = identity(user)
                return (
                  <tr key={user.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold uppercase text-primary">
                          {initialsOf(name)}
                        </span>
                        <span className="font-medium text-white">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.roles.length > 0 ? user.roles.map(roleLabel).join(', ') : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <EmailBadge email={user.email} confirmedAt={user.email_confirmed_at} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/users/${user.id}`} className="font-medium text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {result && <Pagination page={displayPage} totalPages={result.totalPages} baseUrl={baseUrl} />}
      {result && result.users.length === 0 && <div aria-live="polite" className="sr-only">No users to display.</div>}
    </div>
  )
}