import { ROLE_PERMISSIONS, type Permission } from '../../lib/permissions'

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: 'Dashboard', permissions: ['dashboard.view'] },
  {
    label: 'Events',
    permissions: ['events.view', 'events.create', 'events.edit', 'events.delete', 'events.registrations.view', 'events.registrations.manage']
  },
  { label: 'News', permissions: ['news.view', 'news.create', 'news.edit', 'news.delete'] },
  { label: 'Company', permissions: ['company.view', 'company.edit'] },
  { label: 'Media', permissions: ['media.view', 'media.manage'] },
  { label: 'Contact Messages', permissions: ['contact.view', 'contact.manage'] },
  { label: 'Users', permissions: ['users.view', 'users.manage'] },
  { label: 'Roles', permissions: ['roles.view', 'roles.manage'] },
  { label: 'Finance', permissions: ['finance.view', 'finance.manage'] },
  { label: 'Activity', permissions: ['activity.view'] },
  { label: 'Settings', permissions: ['settings.view', 'settings.manage'] }
]

const PERMISSION_LABELS: Record<string, string> = {
  'dashboard.view': 'View dashboard',
  'events.view': 'View events',
  'events.create': 'Create events',
  'events.edit': 'Edit events',
  'events.delete': 'Delete events',
  'events.registrations.view': 'View registrations',
  'events.registrations.manage': 'Manage registrations',
  'news.view': 'View news',
  'news.create': 'Create news',
  'news.edit': 'Edit news',
  'news.delete': 'Delete news',
  'company.view': 'View company content',
  'company.edit': 'Edit company content',
  'media.view': 'View media',
  'media.manage': 'Manage media',
  'contact.view': 'View contact messages',
  'contact.manage': 'Manage contact messages',
  'users.view': 'View users',
  'users.manage': 'Manage users',
  'roles.view': 'View roles',
  'roles.manage': 'Manage roles',
  'finance.view': 'View finance',
  'finance.manage': 'Manage finance',
  'activity.view': 'View activity log',
  'settings.view': 'View settings',
  'settings.manage': 'Manage settings'
}

export const ROLE_ORDER = ['super_admin', 'admin', 'editor', 'coach', 'finance'] as const

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  editor: 'Editor',
  coach: 'Coach',
  finance: 'Finance'
}

export function roleHasPermission(role: string, permission: Permission): boolean {
  if (role === 'super_admin') return true
  const granted = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]
  return granted ? granted.includes(permission) : false
}

export default function PermissionMatrix({ roles }: { roles: string[] }) {
  const displayRoles = ROLE_ORDER.filter((role) => roles.includes(role))
  if (displayRoles.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[44rem] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-gray-400">
            <th className="px-4 py-3">Permission</th>
            {displayRoles.map((role) => (
              <th key={role} className="px-4 py-3 text-center">
                {ROLE_LABELS[role] || role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_GROUPS.map((group) => (
            <RowGroup
              key={group.label}
              group={group}
              displayRoles={displayRoles}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RowGroup({ group, displayRoles }: { group: (typeof PERMISSION_GROUPS)[number]; displayRoles: readonly string[] }) {
  return (
    <>
      <tr className="border-b border-white/5 bg-white/[0.03]">
        <td colSpan={displayRoles.length + 1} className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {group.label}
        </td>
      </tr>
      {group.permissions.map((permission) => (
        <tr key={permission} className="border-b border-white/5 last:border-0">
          <td className="px-4 py-2.5">
            <span className="font-medium text-white">{PERMISSION_LABELS[permission] || permission}</span>
            <span className="block text-xs text-gray-500">{permission}</span>
          </td>
          {displayRoles.map((role) => {
            const has = roleHasPermission(role, permission)
            return (
              <td key={role} className="px-4 py-2.5 text-center">
                {has ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300" aria-label="Granted">
                    ✓
                  </span>
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-gray-600" aria-label="Not granted">
                    —
                  </span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
