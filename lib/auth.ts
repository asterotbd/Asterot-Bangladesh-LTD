import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import createServerClient from './supabaseServer'
import getAdminSupabase from './supabaseAdmin'
import {
  type Permission,
  hasPermission,
  hasAnyPermission,
  getPermissionsForRoles
} from './permissions'

// Per-request memoization (React cache): the same request never calls
// GoTrue/Postgres more than once for the same user/role data, regardless of
// how many server components, layouts, or helpers need it.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

export const getCurrentProfile = cache(async (userId: string) => {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, display_name')
    .eq('id', userId)
    .maybeSingle()
  return (data as { full_name: string | null; display_name: string | null } | null) ?? null
})

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

// Resolves roles in a single query (embedded `roles(name)`); memoized so
// repeated callers in one request share the same round trip.
export const getUserRoles = cache(async (userId: string) => {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId)
  if (error) throw error
  const names = new Set<string>()
  for (const row of (data ?? []) as { roles: { name: string } | { name: string }[] | null }[]) {
    const role = Array.isArray(row.roles) ? row.roles[0] : row.roles
    if (role?.name) names.add(role.name)
  }
  return [...names]
})

export const getUserPermissions = cache(async (userId: string): Promise<Permission[]> => {
  try {
    const roles = await getUserRoles(userId)
    return getPermissionsForRoles(roles)
  } catch {
    return []
  }
})

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
  const user = await getCurrentUser()
  if (!user) {
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