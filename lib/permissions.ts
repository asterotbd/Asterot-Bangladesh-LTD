export const ADMIN_ROLES = ['super_admin', 'admin', 'editor', 'coach', 'finance'] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export const PERMISSIONS = [
  'dashboard.view',
  'content.view',
  'content.edit',
  'content.publish',
  'content.delete',
  'events.view',
  'events.create',
  'events.edit',
  'events.delete',
  'events.registrations.view',
  'events.registrations.manage',
  'news.view',
  'news.create',
  'news.edit',
  'news.delete',
  'company.view',
  'company.edit',
  'media.view',
  'media.manage',
  'contact.view',
  'contact.manage',
  'users.view',
  'users.manage',
  'roles.view',
  'roles.manage',
  'finance.view',
  'finance.manage',
  'activity.view',
  'settings.view',
  'settings.manage'
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  admin: [
    'dashboard.view',
    'content.view',
    'content.edit',
    'content.publish',
    'events.view',
    'events.create',
    'events.edit',
    'events.delete',
    'events.registrations.view',
    'events.registrations.manage',
    'news.view',
    'news.create',
    'news.edit',
    'news.delete',
    'company.view',
    'company.edit',
    'media.view',
    'contact.view',
    'contact.manage',
    'users.view',
    'users.manage',
    'finance.view',
    'activity.view',
    'settings.view'
  ],
  editor: [
    'dashboard.view',
    'content.view',
    'content.edit',
    'content.publish',
    'events.view',
    'events.create',
    'events.edit',
    'events.registrations.view',
    'news.view',
    'news.create',
    'news.edit',
    'company.view'
  ],
  coach: [
    'dashboard.view',
    'events.view',
    'events.registrations.view',
    'events.registrations.manage'
  ],
  finance: [
    'dashboard.view',
    'finance.view',
    'finance.manage',
    'events.view',
    'events.registrations.view'
  ]
}

export function hasPermission(userPermissions: readonly Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission)
}

export function hasAnyPermission(userPermissions: readonly Permission[], required: readonly Permission[]): boolean {
  return required.some((permission) => userPermissions.includes(permission))
}

export function hasAllPermissions(userPermissions: readonly Permission[], required: readonly Permission[]): boolean {
  return required.every((permission) => userPermissions.includes(permission))
}

export function getPermissionsForRoles(roles: readonly string[]): Permission[] {
  const permissions: Permission[] = []
  for (const role of roles) {
    const granted = ROLE_PERMISSIONS[role as AdminRole]
    if (!granted) continue
    for (const permission of granted) {
      if (!permissions.includes(permission)) permissions.push(permission)
    }
  }
  return permissions
}