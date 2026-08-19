export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../lib/auth'
import { hasPermission, ADMIN_ROLES, ROLE_PERMISSIONS, type Permission } from '../../../../lib/permissions'
import { getRoleAssignmentCounts, type RoleAssignmentCount } from '../../../../lib/user-roles-server'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  editor: 'Editor',
  coach: 'Coach',
  finance: 'Finance'
}

const DOMAIN_ORDER = ['events', 'registrations', 'news', 'company', 'users', 'roles', 'finance', 'settings'] as const

const DOMAIN_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  events: 'Events',
  registrations: 'Registrations',
  news: 'News',
  company: 'Company',
  users: 'Users',
  roles: 'Roles',
  finance: 'Finance',
  settings: 'Settings'
}

function domainOf(permission: string): string {
  if (permission.startsWith('events.registrations')) return 'registrations'
  return permission.split('.')[0]
}

function permissionDomains(permissions: readonly Permission[]): string[] {
  const seen = new Set<string>()
  const domains: string[] = []
  for (const permission of permissions) {
    const domain = domainOf(permission)
    if (domain === 'dashboard' || seen.has(domain)) continue
    seen.add(domain)
    domains.push(domain)
  }
  return domains.sort((a, b) => {
    const ia = DOMAIN_ORDER.indexOf(a as (typeof DOMAIN_ORDER)[number])
    const ib = DOMAIN_ORDER.indexOf(b as (typeof DOMAIN_ORDER)[number])
    return (ia === -1 ? DOMAIN_ORDER.length : ia) - (ib === -1 ? DOMAIN_ORDER.length : ib)
  })
}

export default async function AdminRolesPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['roles.view'])
  const canViewUsers = hasPermission(permissions, 'users.view')

  let counts: RoleAssignmentCount[] = []
  let failed = false
  try {
    counts = await getRoleAssignmentCounts()
  } catch (err) {
    console.error('Admin roles load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Roles</h1>
        <p className="mt-1 text-sm text-gray-400">
          System roles define the permissions available across the admin. Role definitions are fixed.
        </p>
      </header>

      {failed ? (
        <div className="rounded-2xl border border-white/10 bg-panel">
          <p className="py-16 text-center text-sm text-amber-200/80">Unable to load roles.</p>
        </div>
      ) : counts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-panel">
          <p className="py-16 text-center text-sm text-gray-500">No roles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {counts.map((role) => {
            const label = ROLE_LABELS[role.name] || role.name
            const permissionsForRole = ROLE_PERMISSIONS[role.name as (typeof ADMIN_ROLES)[number]]
            const domains = permissionsForRole ? permissionDomains(permissionsForRole) : []
            const isSuperAdmin = role.name === 'super_admin'
            return (
              <section key={role.id} className="rounded-2xl border border-white/10 bg-panel p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-white">{label}</h2>
                    <p className="mt-1 text-sm text-gray-400">{role.description || 'No description provided.'}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                    {role.count} user{role.count === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Permissions</h3>
                  {isSuperAdmin ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        All permissions
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {domains.map((domain) => (
                        <span
                          key={domain}
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300"
                        >
                          {DOMAIN_LABELS[domain] || domain}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {canViewUsers && (
                  <Link
                    href={`/admin/users?role=${role.id}`}
                    className="mt-5 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    View users with this role →
                  </Link>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
