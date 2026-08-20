export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAnyPermission, getCurrentUser } from '../../../../lib/auth'
import { hasPermission, ADMIN_ROLES, ROLE_PERMISSIONS, type Permission } from '../../../../lib/permissions'
import { getRoleAssignmentCounts, type RoleAssignmentCount } from '../../../../lib/user-roles-server'
import PageHeader from '../../../../components/admin/PageHeader'
import { Panel, ErrorState } from '../../../../components/admin/Panel'
import RoleDescriptionForm from '../../../../components/admin/RoleDescriptionForm'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  editor: 'Editor',
  coach: 'Coach',
  finance: 'Finance'
}

const DOMAIN_ORDER = ['dashboard', 'events', 'registrations', 'news', 'company', 'media', 'contact', 'users', 'roles', 'finance', 'activity', 'settings'] as const

const DOMAIN_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  events: 'Events',
  registrations: 'Registrations',
  news: 'News',
  company: 'Company',
  media: 'Media',
  contact: 'Contact Messages',
  users: 'Users',
  roles: 'Roles',
  finance: 'Finance',
  activity: 'Activity',
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
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['roles.view'])
  const canViewUsers = hasPermission(permissions, 'users.view')
  const canManage = hasPermission(permissions, 'roles.manage')

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
      <PageHeader
        title="Roles"
        description="System roles define the permissions available across the admin. Names are fixed by the permission matrix; descriptions can be edited."
      />

      {canManage && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
          Roles are managed through the database RPC (assign_user_role / remove_user_role), which enforces the
          last-super-admin and self-protection safeguards. Permission definitions live in the permission matrix.
        </p>
      )}

      {failed ? (
        <Panel><ErrorState message="Unable to load roles." /></Panel>
      ) : counts.length === 0 ? (
        <Panel><ErrorState message="No roles found." /></Panel>
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

                {canManage && (
                  <div className="mt-5">
                    <RoleDescriptionForm roleId={role.id} roleName={role.name} initialDescription={role.description ?? ''} />
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-4">
                  {canViewUsers && (
                    <Link href={`/admin/users?role=${role.id}`} className="inline-flex text-sm font-medium text-primary hover:underline">
                      View users with this role →
                    </Link>
                  )}
                  <Link href="/admin/permissions" className="inline-flex text-sm font-medium text-gray-300 hover:text-white hover:underline">
                    Permission matrix →
                  </Link>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}