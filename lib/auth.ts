import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import createServerClient from './supabaseServer'
import getAdminSupabase from './supabaseAdmin'
import {
  type Permission,
  hasPermission,
  hasAnyPermission,
  getPermissionsForRoles
} from './permissions'

export async function requireAuth() {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }
  return user
}

export async function getUserRoles(userId: string) {
  const admin = getAdminSupabase()
  const { data: ur, error: urErr } = await admin.from('user_roles').select('role_id').eq('user_id', userId)
  if (urErr) throw urErr
  const roleIds = (ur || []).map((r: any) => r.role_id).filter(Boolean)
  if (roleIds.length === 0) return []
  const { data: rolesData, error: rolesErr } = await admin.from('roles').select('name').in('id', roleIds)
  if (rolesErr) throw rolesErr
  return (rolesData || []).map((r: any) => r.name)
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const roles = await getUserRoles(userId)
    return getPermissionsForRoles(roles)
  } catch {
    return []
  }
}

export async function requirePermission(userId: string, permission: Permission) {
  const permissions = await getUserPermissions(userId)
  if (!hasPermission(permissions, permission)) redirect('/account')
  return permissions
}

export async function requireAnyPermission(userId: string, required: readonly Permission[]) {
  const permissions = await getUserPermissions(userId)
  if (!hasAnyPermission(permissions, required)) redirect('/account')
  return permissions
}

type ApiCheck =
  | { ok: true; user: User }
  | { ok: false; status: number; message: string; user: User | null }

export async function requireApiPermission(permission: Permission): Promise<ApiCheck> {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { ok: false, status: 401, message: 'Not authenticated', user: null }
  }
  const permissions = await getUserPermissions(user.id)
  if (!hasPermission(permissions, permission)) {
    return { ok: false, status: 403, message: 'Forbidden', user }
  }
  return { ok: true, user }
}

export async function requireAnyRole(userId: string, allowed: string[]) {
  const roles = await getUserRoles(userId)
  const found = roles.find((r: string) => allowed.includes(r))
  if (!found) {
    redirect('/account')
  }
  return roles
}

export async function requireRole(userId: string, role: string) {
  const roles = await getUserRoles(userId)
  if (!roles.includes(role)) redirect('/account')
  return roles
}