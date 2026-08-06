import { redirect } from 'next/navigation'
import createServerClient from './supabaseServer'
import getAdminSupabase from './supabaseAdmin'

export async function requireAuth() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) {
    redirect('/login')
  }
  return session.user
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
