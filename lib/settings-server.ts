import getAdminSupabase from './supabaseAdmin'

export type DbSiteSetting = {
  id: string
  key: string
  value: unknown
  updated_at: string | null
}

export async function listSettings(): Promise<DbSiteSetting[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('site_settings').select('id, key, value, updated_at').order('key', { ascending: true })
  if (error) throw error
  return (data ?? []) as DbSiteSetting[]
}

export async function upsertSetting(key: string, value: unknown): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('site_settings') as any)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

export async function deleteSetting(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('site_settings') as any).delete().eq('id', id).select('id')
  if (error) throw error
  return (data ?? []).length > 0
}
