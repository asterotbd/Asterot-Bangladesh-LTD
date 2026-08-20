import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

export const FAQ_STATUSES = ['draft', 'published', 'archived'] as const
export type FaqStatus = (typeof FAQ_STATUSES)[number]

export type DbFaqItem = {
  id: string
  question_en: string | null
  answer_en: string | null
  question_bn: string | null
  answer_bn: string | null
  category: string | null
  display_order: number | null
  status: string | null
  published: boolean | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export type FaqListResult = {
  items: DbFaqItem[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export const FAQ_FIELDS = 'id, question_en, answer_en, question_bn, answer_bn, category, display_order, status, published, created_by, created_at, updated_at'

export async function listFaq({
  page = 1,
  perPage = 50,
  search = '',
  status = '',
  category = ''
}: {
  page?: number
  perPage?: number
  search?: string
  status?: string
  category?: string
}): Promise<FaqListResult> {
  const admin = getAdminSupabase()
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage)))

  let query = admin.from('faq').select(FAQ_FIELDS, { count: 'exact' })

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`)
    query = query.or(`question_en.ilike.%${escaped}%,answer_en.ilike.%${escaped}%`)
  }
  if (status && (FAQ_STATUSES as readonly string[]).includes(status as FaqStatus)) query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, count, error } = await query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range((safePage - 1) * safePerPage, safePage * safePerPage - 1)
  if (error) throw error

  const total = count ?? 0
  return {
    items: (data ?? []) as DbFaqItem[],
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(1, Math.ceil(total / safePerPage))
  }
}

export async function getFaqItem(id: string): Promise<DbFaqItem | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('faq').select(FAQ_FIELDS).eq('id', id).maybeSingle()
  if (error) throw error
  return (data as DbFaqItem | null) ?? null
}

export async function getFaqCategories(): Promise<string[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('faq').select('category')
  if (error) throw error
  const categories = new Set<string>()
  for (const row of (data ?? []) as { category: string | null }[]) {
    if (row.category && row.category.trim()) categories.add(row.category.trim())
  }
  return [...categories].sort((a, b) => a.localeCompare(b))
}

export async function createFaqItem(record: Partial<DbFaqItem>): Promise<DbFaqItem | null> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('faq') as any).insert(record).select(FAQ_FIELDS).single()
  if (error) {
    logError('faq.create', error)
    throw error
  }
  return (data as DbFaqItem) ?? null
}

export async function updateFaqItem(id: string, fields: Partial<DbFaqItem>): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('faq') as any)
    .update(fields)
    .eq('id', id)
    .select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

export async function deleteFaqItem(id: string): Promise<boolean> {
  const admin = getAdminSupabase()
  const { data, error } = await (admin.from('faq') as any).delete().eq('id', id).select('id')
  if (error) throw error
  return (data ?? []).length > 0
}

export async function reorderFaq(orderedIds: string[]): Promise<void> {
  const admin = getAdminSupabase()
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await (admin.from('faq') as any)
      .update({ display_order: i })
      .eq('id', orderedIds[i])
    if (error) throw error
  }
}

// Public-facing published FAQ items, ordered for display.
export async function getPublishedFaq(): Promise<DbFaqItem[]> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('faq')
    .select(FAQ_FIELDS)
    .eq('published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) {
    logError('faq.public-list', error)
    return []
  }
  return (data ?? []) as DbFaqItem[]
}

// Rebuild the FAQ display order to 0..n-1 after deletes/creates.
export async function normalizeFaqOrder(): Promise<void> {
  const admin = getAdminSupabase()
  const { data, error } = await admin.from('faq').select('id, display_order').order('display_order', { ascending: true }).order('created_at', { ascending: false })
  if (error) return
  for (let i = 0; i < (data ?? []).length; i++) {
    const row = (data ?? [])[i] as { id: string; display_order: number | null }
    if (row.display_order === i) continue
    await (admin.from('faq') as any).update({ display_order: i }).eq('id', row.id)
  }
}