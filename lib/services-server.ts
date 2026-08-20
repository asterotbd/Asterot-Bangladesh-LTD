import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export type DbService = {
  id: string
  title_en: string | null
  title_bn: string | null
  short_description_en: string | null
  short_description_bn: string | null
  description_en: string | null
  description_bn: string | null
  features: unknown
  media_id: string | null
  published: boolean | null
  display_order: number | null
  created_at: string | null
  updated_at: string | null
}

export const SERVICE_FIELDS =
  'id, title_en, title_bn, short_description_en, short_description_bn, description_en, description_bn, features, media_id, published, display_order, created_at, updated_at'

export async function listServices({ status = '' }: { status?: string } = {}): Promise<DbService[]> {
  const admin = getAdminSupabase()
  let query = admin.from('services').select(SERVICE_FIELDS)
  if (status === 'published') query = query.eq('published', true)
  if (status === 'draft' || status === 'archived') query = query.eq('published', false)
  const { data, error } = await query.order('display_order', { ascending: true }).order('created_at', { ascending: false })
  if (error) {
    logError('services.list', error)
    return []
  }
  return (data ?? []) as DbService[]
}

export async function getService(id: string): Promise<DbService | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('services').select(SERVICE_FIELDS).eq('id', id).maybeSingle()
  if (error) {
    logError('services.get', error)
    return null
  }
  return (data as DbService | null) ?? null
}

export async function createService(record: Partial<DbService>): Promise<DbService | null> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('services') as any).insert(record).select(SERVICE_FIELDS).single()
  if (error) {
    logError('services.create', error)
    throw error
  }
  return (data as DbService) ?? null
}

export async function updateService(id: string, fields: Partial<DbService>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('services') as any)
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) {
    logError('services.update', error)
    throw error
  }
  return (data ?? []).length > 0
}

export async function deleteService(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { error } = await (admin.from('services') as any).delete().eq('id', id)
  if (error) {
    logError('services.delete', error)
    throw error
  }
  return true
}

// Public-facing services for the homepage capabilities grid.
export async function getPublishedServices(): Promise<DbService[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('services')
    .select(SERVICE_FIELDS)
    .eq('published', true)
    .order('display_order', { ascending: true })
  if (error) {
    logError('services.public-list', error)
    return []
  }
  return (data ?? []) as DbService[]
}