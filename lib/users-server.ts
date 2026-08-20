import getAdminSupabase, { getAuthAdminSupabase } from './supabaseAdmin'

export type UserRoleCount = { role: string; count: number }

export type AdminUserListItem = {
  id: string
  display_name: string | null
  full_name: string | null
  email: string | null
  email_confirmed_at: string | null
  created_at: string | null
  roles: string[]
}

export type UserListResult = {
  users: AdminUserListItem[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export type AdminUserDetail = AdminUserListItem & {
  locale: string | null
  phone: string | null
  bio: string | null
  last_sign_in_at: string | null
}

export type AdminRole = { id: string; name: string; description: string | null }

type AuthInfo = {
  email: string | null
  email_confirmed_at: string | null
  last_sign_in_at: string | null
}

export async function getTotalUserCount(): Promise<number> {
  const admin = getAdminSupabase()
  const { count, error } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function getUserCountsByRole(): Promise<UserRoleCount[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('user_roles').select('roles(name)')
  if (error) throw error
  const counts = new Map<string, number>()
  for (const row of (data ?? []) as {
    roles: { name: string } | { name: string }[] | null
  }[]) {
    const role = Array.isArray(row.roles) ? row.roles[0] : row.roles
    const name = role?.name
    if (!name) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
}

export async function listRoles(): Promise<AdminRole[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('roles')
    .select('id, name, description')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as AdminRole[]
}

export async function listUsers({
  page = 1,
  perPage = 20,
  search = '',
  roleId = null
}: {
  page?: number
  perPage?: number
  search?: string
  roleId?: string | null
}): Promise<UserListResult> {
  const admin = getAdminSupabase()
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage)))

  let roleUserIds: string[] | null = null
  if (roleId) {
    const { data: ur, error: urErr } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('role_id', roleId)
    if (urErr) throw urErr
    roleUserIds = ((ur ?? []) as { user_id: string }[]).map((r) => r.user_id)
    if (roleUserIds.length === 0) {
      return { users: [], total: 0, page: safePage, perPage: safePerPage, totalPages: 0 }
    }
  }

  let query = admin
    .from('profiles')
    .select('id, display_name, full_name, created_at', { count: 'exact' })
  if (roleUserIds !== null) {
    query = query.in('id', roleUserIds)
  }
  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`)
    const emailMatchedIds = await getEmailMatchedUserIds(term)
    const orParts = [`display_name.ilike.%${escaped}%`, `full_name.ilike.%${escaped}%`]
    if (emailMatchedIds.length > 0) {
      orParts.push(`and(id.in.(${emailMatchedIds.join(',')}))`)
    }
    query = query.or(orParts.join(','))
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePerPage, safePage * safePerPage - 1)
  if (error) throw error

  const total = count ?? 0
  const rows = (data ?? []) as {
    id: string
    display_name: string | null
    full_name: string | null
    created_at: string | null
  }[]
  const userIds = rows.map((r) => r.id)

  const roles = userIds.length > 0 ? await getRolesForUserIds(userIds) : new Map<string, string[]>()
  const authInfos = userIds.length > 0 ? await getAuthInfoForUserIds(userIds) : new Map<string, AuthInfo>()

  return {
    users: rows.map((row) => ({
      id: row.id,
      display_name: row.display_name,
      full_name: row.full_name,
      email: authInfos.get(row.id)?.email ?? null,
      email_confirmed_at: authInfos.get(row.id)?.email_confirmed_at ?? null,
      created_at: row.created_at,
      roles: roles.get(row.id) ?? []
    })),
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil(total / safePerPage))
  }
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('profiles')
    .select('id, display_name, full_name, locale, phone, bio, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  const profile = data as {
    id: string
    display_name: string | null
    full_name: string | null
    locale: string | null
    phone: string | null
    bio: string | null
    created_at: string | null
  } | null
  if (!profile) return null

  const roles = await getRolesForUserIds([userId])
  const authInfo = await getAuthInfoForUserIds([userId])
  const info = authInfo.get(userId)

  return {
    id: profile.id,
    display_name: profile.display_name,
    full_name: profile.full_name,
    email: info?.email ?? null,
    email_confirmed_at: info?.email_confirmed_at ?? null,
    last_sign_in_at: info?.last_sign_in_at ?? null,
    created_at: profile.created_at,
    roles: roles.get(userId) ?? [],
    locale: profile.locale,
    phone: profile.phone,
    bio: profile.bio
  }
}

const PROFILE_MAX_LENGTH: Record<string, number> = {
  display_name: 120,
  full_name: 160,
  locale: 16,
  phone: 30,
  bio: 500
}

export async function updateUserProfile(
  userId: string,
  fields: { display_name?: string | null; full_name?: string | null; locale?: string | null; phone?: string | null; bio?: string | null }
): Promise<boolean> {
  const admin = getAdminSupabase()
  const payload: Record<string, string | null> = {}
  for (const key of ['display_name', 'full_name', 'locale', 'phone', 'bio'] as const) {
    const value = fields[key]
    if (value === undefined) continue
    const clean = value === null ? null : value.trim()
    if (clean !== null && clean.length > PROFILE_MAX_LENGTH[key]) {
      throw new Error(`Invalid ${key}`)
    }
    payload[key] = clean
  }

  const { data, error } = await (admin.from('profiles') as any)
    .update(payload)
    .eq('id', userId)
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

async function getRolesForUserIds(userIds: string[]): Promise<Map<string, string[]>> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('user_roles')
    .select('user_id, roles(name)')
    .in('user_id', userIds)
  if (error) throw error
  const map = new Map<string, string[]>()
  for (const row of (data ?? []) as {
    user_id: string
    roles: { name: string } | { name: string }[] | null
  }[]) {
    const role = Array.isArray(row.roles) ? row.roles[0] : row.roles
    const name = role?.name
    if (!name) continue
    const list = map.get(row.user_id) ?? []
    list.push(name)
    map.set(row.user_id, list)
  }
  return map
}

async function getEmailMatchedUserIds(term: string): Promise<string[]> {
  // The service-role client scoped to the auth schema can match users by email.
  // Any failure degrades gracefully to name-only search.
  try {
    const authAdmin = getAuthAdminSupabase()
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`)
    const { data, error } = await authAdmin.from('users').select('id').ilike('email', `%${escaped}%`).limit(100)
    if (error) return []
    return ((data ?? []) as { id: string }[]).map((u) => u.id)
  } catch {
    return []
  }
}

async function getAuthInfoForUserIds(userIds: string[]): Promise<Map<string, AuthInfo>> {
  const uniqueIds = [...new Set(userIds)]
  if (uniqueIds.length === 0) return new Map()
  const admin = getAuthAdminSupabase()
  const { data, error } = await admin
    .from('users')
    .select('id, email, email_confirmed_at, last_sign_in_at')
    .in('id', uniqueIds)
  const map = new Map<string, AuthInfo>()
  for (const id of uniqueIds) {
    map.set(id, { email: null, email_confirmed_at: null, last_sign_in_at: null })
  }
  if (error) {
    console.error('getAuthInfoForUserIds error', error.message)
    return map
  }
  for (const row of (data ?? []) as Array<{ id: string; email: string | null; email_confirmed_at: string | null; last_sign_in_at: string | null }>) {
    map.set(row.id, {
      email: row.email,
      email_confirmed_at: row.email_confirmed_at,
      last_sign_in_at: row.last_sign_in_at
    })
  }
  return map
}