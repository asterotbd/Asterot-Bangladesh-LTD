export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAnyPermission, getCurrentUser } from '../../../../../lib/auth'
import { hasPermission, getPermissionsForRoles } from '../../../../../lib/permissions'
import { getUserDetail, type AdminUserDetail } from '../../../../../lib/users-server'
import { getUserRolesForManagement } from '../../../../../lib/user-roles-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel } from '../../../../../components/admin/Panel'
import UserProfileForm from '../../../../../components/admin/UserProfileForm'
import UserRoleManager from '../../../../../components/admin/UserRoleManager'

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

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function identity(user: AdminUserDetail): string {
  if (user.display_name) return user.display_name
  if (user.full_name) return user.full_name
  if (user.email) return user.email.split('@')[0] || 'Member'
  return 'Member'
}

function DetailCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-panel">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-200">{value || '—'}</dd>
    </div>
  )
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const authUser = await getCurrentUser()
  if (!authUser) redirect('/admin/login')

  const permissions = await requireAnyPermission(authUser.id, ['users.view'])
  const canManage = hasPermission(permissions, 'users.manage')
  const canManageRoles = hasPermission(permissions, 'roles.manage')

  let user: AdminUserDetail | null = null
  let failed = false
  try {
    user = await getUserDetail(params.id)
  } catch (err) {
    console.error('Admin user detail error', err)
    failed = true
  }

  let roleAssignment: { assigned: { roleId: string; assignmentId: string; name: string; description: string | null }[]; all: { id: string; name: string; description: string | null }[] } | null = null
  let rolesFailed = false
  if (user) {
    try {
      roleAssignment = await getUserRolesForManagement(user.id)
    } catch (err) {
      console.error('Admin user role assignments load error', err)
      rolesFailed = true
    }
  }

  const assignedRolesForDisplay: { name: string; description?: string | null; assignedBy?: string | null; assignedAt?: string | null }[] = user
    ? roleAssignment
      ? roleAssignment.assigned
      : user.roles.map((name) => ({ name }))
    : []

  const effectivePermissions = user ? getPermissionsForRoles(user.roles) : []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline">
            ← Back to Users
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{user ? identity(user) : 'User'}</h1>
        </div>
      </header>

      {failed ? (
        <div className="rounded-2xl border border-white/10 bg-panel">
          <p className="py-16 text-center text-sm text-amber-200/80">Unable to load this user.</p>
        </div>
      ) : !user ? (
        <div className="rounded-2xl border border-white/10 bg-panel">
          <p className="py-16 text-center text-sm text-gray-500">User not found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <DetailCard title="Profile">
              <dl className="space-y-4">
                <Field label="Display name" value={user.display_name} />
                <Field label="Full name" value={user.full_name} />
                <Field label="Locale" value={user.locale} />
                <Field label="Phone" value={user.phone} />
                <Field label="Bio" value={user.bio} />
              </dl>
            </DetailCard>

            <DetailCard title="Account">
              <dl className="space-y-4">
                <Field label="Email" value={user.email} />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Email status</dt>
                  <dd className="mt-1">
                    {user.email ? (
                      user.email_confirmed_at ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                          Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                          Unconfirmed
                        </span>
                      )
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <Field label="Created" value={formatDate(user.created_at)} />
                <Field label="Last sign-in" value={formatDate(user.last_sign_in_at)} />
              </dl>
            </DetailCard>
          </div>

          <div className="space-y-6">
            {canManageRoles && roleAssignment ? (
              <UserRoleManager
                userId={user.id}
                isSelf={user.id === authUser.id}
                assigned={roleAssignment.assigned}
                allRoles={roleAssignment.all.map((role) => ({
                  roleId: role.id,
                  name: role.name,
                  description: role.description
                }))}
              />
            ) : (
              <DetailCard title="Assigned Roles">
                {rolesFailed && roleAssignment === null ? (
                  <p className="text-sm text-amber-200/80">Unable to load role assignments.</p>
                ) : assignedRolesForDisplay.length > 0 ? (
                  <ul className="space-y-2">
                    {assignedRolesForDisplay.map((role, index) => (
                      <li
                        key={role.name ?? `role-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{ROLE_LABELS[role.name] || role.name}</p>
                          {role.description && <p className="mt-0.5 truncate text-xs text-gray-500">{role.description}</p>}
                          {role.assignedAt && (
                            <p className="mt-0.5 truncate text-xs text-gray-600">
                              Assigned {formatDateTime(role.assignedAt)}
                              {role.assignedBy ? ' by ' + role.assignedBy.slice(0, 8) : ''}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No roles assigned.</p>
                )}
                <p className="mt-4 text-xs text-gray-500">Role changes require the roles.manage permission.</p>
              </DetailCard>
            )}

            {canManage && (
              <UserProfileForm
                userId={user.id}
                initial={{
                  display_name: user.display_name || '',
                  full_name: user.full_name || '',
                  locale: user.locale || '',
                  phone: user.phone || '',
                  bio: user.bio || ''
                }}
              />
            )}

            <DetailCard title="Effective Permissions">
              {effectivePermissions.length === 0 ? (
                <p className="text-sm text-gray-500">This user has no admin permissions.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {effectivePermissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500">
                Permissions are derived from the assigned roles and enforced server-side on every admin route and mutation.
              </p>
            </DetailCard>
          </div>
        </div>
      )}
    </div>
  )
}