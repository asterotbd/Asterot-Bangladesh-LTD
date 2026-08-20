import { ADMIN_ROLES } from './permissions'
import createServerClient from './supabaseServer'
import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'
import { listRoles } from './users-server'

export type RoleDefinition = {
  id: string
  name: string
  description: string | null
}

export type RoleAssignment = {
  roleId: string
  assignmentId: string
  name: string
  description: string | null
  assignedBy: string | null
  assignedAt: string | null
}

export type RoleAssignmentCount = {
  id: string
  name: string
  description: string | null
  count: number
}

export class RoleManagementError extends Error {
  constructor(
    public code:
      | 'USER_NOT_FOUND'
      | 'ROLE_NOT_FOUND'
      | 'NOT_ASSIGNED'
      | 'DUPLICATE'
      | 'OWN_SUPER_ADMIN'
      | 'LAST_SUPER_ADMIN'
      | 'FORBIDDEN'
      | 'MUTATION_FAILED',
    message: string
  ) {
    super(message)
    this.name = 'RoleManagementError'
  }
}

function isSystemRole(name: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(name)
}

// Map a controlled database RPC error to a RoleManagementError. Raw Postgres
// errors are never surfaced to callers; unknown errors are logged and mapped
// to a generic 500.
function rpcErrorToRoleError(error: { message?: string }, fallbackMessage: string): RoleManagementError {
  const message = error?.message ?? ''
  switch (message) {
    case 'UNAUTHENTICATED':
    case 'ACTOR_MISMATCH':
      return new RoleManagementError('MUTATION_FAILED', fallbackMessage)
    case 'UNAUTHORIZED':
      return new RoleManagementError('FORBIDDEN', 'You do not have permission to manage roles.')
    case 'USER_NOT_FOUND':
      return new RoleManagementError('USER_NOT_FOUND', 'User not found.')
    case 'ROLE_NOT_FOUND':
      return new RoleManagementError('ROLE_NOT_FOUND', 'Role not found.')
    case 'DUPLICATE':
      return new RoleManagementError('DUPLICATE', 'Role already assigned.')
    case 'NOT_ASSIGNED':
      return new RoleManagementError('NOT_ASSIGNED', 'Role not assigned.')
    case 'OWN_SUPER_ADMIN':
      return new RoleManagementError('OWN_SUPER_ADMIN', 'You cannot remove your own super admin role.')
    case 'LAST_SUPER_ADMIN':
      return new RoleManagementError('LAST_SUPER_ADMIN', 'The last super admin cannot be removed.')
    default:
      logError('user-roles.rpc', error)
      return new RoleManagementError('MUTATION_FAILED', fallbackMessage)
  }
}

// Role mutations are delegated to the atomic database functions
// (db/migrations/015_atomic_user_role_management.sql). The database is the
// authoritative integrity boundary: it derives the actor from auth.uid(),
// enforces authorization, last-super-admin/self protections with row locks,
// and writes the audit record in the same transaction.
//
// The user-scoped server client is used so the request carries the actor's
// session JWT (auth.uid()); the service-role client carries no user identity
// and must not be used here.
export async function assignUserRole(actorId: string, userId: string, roleId: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.rpc('assign_user_role', {
    target_user_id: userId,
    role_id: roleId,
    actor_id: actorId
  })
  if (error) throw rpcErrorToRoleError(error, 'Unable to assign the role.')
}

export async function removeUserRole(actorId: string, userId: string, roleId: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.rpc('remove_user_role', {
    target_user_id: userId,
    role_id: roleId,
    actor_id: actorId
  })
  if (error) throw rpcErrorToRoleError(error, 'Unable to remove the role.')
}

export async function getUserRolesForManagement(userId: string): Promise<{ assigned: RoleAssignment[]; all: RoleDefinition[] }> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('user_roles')
    .select('id, role_id, assigned_by, created_at, roles(id, name, description)')
    .eq('user_id', userId)
  if (error) throw error

  const assigned: RoleAssignment[] = []
  for (const row of (data ?? []) as {
    id: string
    role_id: string
    assigned_by: string | null
    created_at: string | null
    roles:
      | { id: string; name: string; description: string | null }
      | { id: string; name: string; description: string | null }[]
      | null
  }[]) {
    const role = Array.isArray(row.roles) ? row.roles[0] : row.roles
    if (!role) continue
    assigned.push({
      roleId: role.id,
      assignmentId: row.id,
      name: role.name,
      description: role.description,
      assignedBy: row.assigned_by,
      assignedAt: row.created_at
    })
  }
  assigned.sort((a, b) => a.name.localeCompare(b.name))

  const all = (await listRoles()).filter((role) => isSystemRole(role.name))
  return { assigned, all }
}

export async function getRoleAssignmentCounts(): Promise<RoleAssignmentCount[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('roles').select('id, name, description, user_roles(id)')
  if (error) throw error
  return ((data ?? []) as {
    id: string
    name: string
    description: string | null
    user_roles: { id: string }[] | null
  }[])
    .filter((row) => isSystemRole(row.name))
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      count: row.user_roles?.length ?? 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}