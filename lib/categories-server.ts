import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export type DbCategory = {
  id: string
  name_en: string
  name_bn: string | null
  slug: string | null
  type: string | null
  created_at: string | null
}

const CATEGORY_FIELDS = 'id, name_en, name_bn, slug, type, created_at'

export async function listCategories(): Promise<DbCategory[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('categories').select(CATEGORY_FIELDS).order('name_en', { ascending: true })
  if (error) {
    logError('categories.list', error)
    return []
  }
  return (data ?? []) as DbCategory[]
}

export async function getCategory(id: string): Promise<DbCategory | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('categories').select(CATEGORY_FIELDS).eq('id', id).maybeSingle()
  if (error) {
    logError('categories.get', error)
    return null
  }
  return (data as DbCategory | null) ?? null
}

export async function createCategory(record: Partial<DbCategory>): Promise<DbCategory | null> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('categories') as any).insert(record).select(CATEGORY_FIELDS).single()
  if (error) {
    logError('categories.create', error)
    throw error
  }
  return (data as DbCategory) ?? null
}

export async function updateCategory(id: string, fields: Partial<DbCategory>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('categories') as any)
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) {
    logError('categories.update', error)
    throw error
  }
  return (data ?? []).length > 0
}

export async function deleteCategory(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { error } = await (admin.from('categories') as any).delete().eq('id', id)
  if (error) {
    logError('categories.delete', error)
    throw error
  }
  return true
}

export function categorySlugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}