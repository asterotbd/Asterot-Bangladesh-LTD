import { ADMIN_ROLES } from './permissions'
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
      | 'DUPLICATE'
      | 'NOT_ASSIGNED'
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

// ---- assignUserRole: direct DB operation (no RPC) ----
// Uses the service-role admin client (bypasses RLS). Validates:
///   1. target user exists in profiles
///   2. target role exists and is a system role
///   3. no duplicate assignment (unique constraint on user_id + role_id)
//   4. if duplicate already exists, returns success (idempotent)
//   5. inserts assignment row with actor_id as assigned_by
export async function assignUserRole(actorId: string, userId: string, roleId: string): Promise<void> {
  const admin = getAdminSupabase()

  // 1. Validate target user exists
  const { data: user, error: userError } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (userError) {
    logError('assign-user-role.user-check', userError)
    throw new RoleManagementError('USER_NOT_FOUND', 'User not found.')
  }
  if (!user) {
    throw new RoleManagementError('USER_NOT_FOUND', 'User not found.')
  }

  // 2. Validate role exists and is a system role
  const { data: role, error: roleError } = await admin.from('roles').select('id, name').eq('id', roleId).maybeSingle()
  if (roleError) {
    logError('assign-user-role.role-check', roleError)
    throw new RoleManagementError('ROLE_NOT_FOUND', 'Role not found.')
  }
  if (!role) {
    throw new RoleManagementError('ROLE_NOT_FOUND', 'Role not found.')
  }
  if (!isSystemRole(role.name)) {
    throw new RoleManagementError('ROLE_NOT_FOUND', 'Role not found.')
  }

  // 3. Check for duplicate assignment (unique constraint on user_id + role_id)
  const { data: existing, error: existingError } = await admin.from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle()
  if (existingError) {
    logError('assign-user-role.duplicate-check', existingError)
    throw new RoleManagementError('MUTATION_FAILED', 'Unable to check for duplicate assignment.')
  }

  if (existing) {
    // User already has this role – idempotent; UI should say the role is assigned.
    return
  }

  // 4. Insert the assignment
  const { error: insertError } = await admin.from('user_roles').insert({
    user_id: userId,
    role_id: roleId,
    assigned_by: actorId,
    created_at: new Date().toISOString()
  })

  if (insertError) {
    logError('assign-user-role.insert', insertError)
    throw new RoleManagementError('MUTATION_FAILED', 'Unable to assign the role.')
  }
}

// ---- removeUserRole: direct DB operation (no RPC) ----
// Uses the service-role admin client. Keeps all existing Super Admin protection:
//   – actor may not remove their own super_admin role
///   – the last super_admin may not be removed
export async function removeUserRole(actorId: string, userId: string, roleId: string): Promise<void> {
  const admin = getAdminSupabase()

  // 1. Validate target user exists
  const { data: user, error: userError } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (userError) {
    logError('remove-user-role.user-check', userError)
    throw new RoleManagementError('USER_NOT_FOUND', 'User not found.')
  }
  if (!user) {
    throw new RoleManagementError('USER_NOT_FOUND', 'User not found.')
  }

  // 2. Validate role exists and is a system role
  const { data: role, error: roleError } = await admin.from('roles').select('id, name').eq('id', roleId).maybeSingle()
  if (roleError) {
    logError('remove-user-role.role-check', roleError)
    throw new RoleManagementError('ROLE_NOT_FOUND', 'Role not found.')
  }
  if (!role) {
    throw new RoleManagementError('ROLE_NOT_FOUND', 'Role not found.')
  }
  if (!isSystemRole(role.name)) {
    throw new RoleManagementError('ROLE_NOT_FOUND', 'Role not found.')
  }

  // 3. Check if the assignment exists
  const { data: assignment, error: assignmentError } = await admin.from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle()
  if (assignmentError) {
    logError('remove-user-role.assignment-check', assignmentError)
    throw new RoleManagementError('MUTATION_FAILED', 'Unable to check role assignment.')
  }

  if (!assignment) {
    throw new RoleManagementError('NOT_ASSIGNED', 'Role not assigned.')
  }

  // 4. Super Admin protection: actor may not remove their own super_admin role
  if (role.name === 'super_admin' && userId === actorId) {
    throw new RoleManagementError('OWN_SUPER_ADMIN', 'You cannot remove your own super admin role.')
  }

  // 5. Super Admin count protection: the last super_admin may not be removed
  if (role.name === 'super_admin') {
    const { count, error: countError } = await admin.from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', roleId)

    if (countError) {
      logError('remove-user-role.super-admin-count', countError)
      throw new RoleManagementError('MUTATION_FAILED', 'Unable to check super admin count.')
    }

    if ((count ?? 0) <= 1) {
      throw new RoleManagementError('LAST_SUPER_ADMIN', 'The last super admin cannot be removed.')
    }
  }

  // 6. Delete the assignment
  const { error: deleteError } = await admin.from('user_roles').delete().eq('id', assignment.id)

  if (deleteError) {
    logError('remove-user-role.delete', deleteError)
    throw new RoleManagementError('MUTATION_FAILED', 'Unable to remove the role.')
  }
}

// ============================================================
// getUserRolesForManagement – already uses getAdminSupabase()
// no changes needed.
// ============================================================

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

// ============================================================
// getRoleAssignmentCounts – already uses getAdminSupabase()
// no changes needed.
// ============================================================

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