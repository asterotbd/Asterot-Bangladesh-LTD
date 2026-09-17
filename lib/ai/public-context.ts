// Public, read-only context for the AI Guide (app/api/ai/guide/route.ts).
//
// Every source below is scoped to published content only:
//   - company_info: filtered to published = true, in getPublicCompanyInfo()
//   - events: getPublishedEvents() (lib/events-server.ts) - published = true
//   - news: getPublishedNewsArticles() (lib/news-server.ts) - published = true
//   - faq: getPublishedFaq() (lib/faq-server.ts) - published = true
//
// Nothing here reads admin/user/role/permission data, audit logs, payments,
// registrations, academy applications, contact messages, or draft/unpublished
// CMS content. Each field returned is copied out individually into a plain
// object - never a raw DB row - so a future column added to one of these
// tables cannot silently widen what reaches the AI prompt.
//
// This module must only be imported by the AI guide route.

import getAdminSupabase from '../supabaseAdmin'
import { logError } from '../api-utils'
import { getPublishedEvents } from '../events-server'
import { getPublishedFaq } from '../faq-server'
import { getPublishedNewsArticles } from '../news-server'

export type PublicCompanyInfo = {
  name: string | null
  tagline: string | null
  shortDescription: string | null
  aboutText: string | null
  location: string | null
  foundedDate: string | null
}

async function getPublicCompanyInfo(): Promise<PublicCompanyInfo | null> {
  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('company_info')
    .select('name_en, tagline_en, short_description_en, about_en, location, founded_date')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    logError('ai.public-context.company', error)
    return null
  }
  if (!data) return null
  const row = data as {
    name_en: string | null
    tagline_en: string | null
    short_description_en: string | null
    about_en: string | null
    location: string | null
    founded_date: string | null
  }
  return {
    name: row.name_en,
    tagline: row.tagline_en,
    shortDescription: row.short_description_en,
    aboutText: row.about_en,
    location: row.location,
    foundedDate: row.founded_date
  }
}

export type NavItem = { label: string; href: string }

// Kept in sync with APPROVED_ROUTES/ACTION_MAP in app/api/ai/guide/route.ts -
// these are the only hrefs the AI is ever allowed to suggest.
export const NAVIGATION: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  { label: 'Media', href: '/media' },
  { label: 'Videos', href: '/media/videos' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' }
]

export type PublicAiContext = {
  company: PublicCompanyInfo | null
  events: { title: string; date: string | null; location: string | null; description: string | null }[]
  news: { title: string; excerpt: string; date: string }[]
  faq: { question: string; answer: string }[]
}

const MAX_EVENTS = 8
const MAX_NEWS = 5
const MAX_FAQ = 15
// Defensive cap on the serialized prompt block, independent of the per-list
// caps above, so a single long CMS field can't blow up prompt size.
const MAX_CONTEXT_CHARS = 6000

// Builds the bounded, published-only context injected into the AI Guide's
// system prompt. Any single source failing (e.g. a transient DB error) is
// logged and treated as empty rather than failing the whole request - the
// guide degrades to "no data available" for that section instead of erroring.
export async function getPublicAiContext(): Promise<PublicAiContext> {
  const [company, events, news, faq] = await Promise.all([
    getPublicCompanyInfo().catch((err) => {
      logError('ai.public-context.company', err)
      return null
    }),
    getPublishedEvents().catch((err) => {
      logError('ai.public-context.events', err)
      return []
    }),
    getPublishedNewsArticles().catch((err) => {
      logError('ai.public-context.news', err)
      return []
    }),
    getPublishedFaq().catch((err) => {
      logError('ai.public-context.faq', err)
      return []
    })
  ])

  return {
    company,
    events: events.slice(0, MAX_EVENTS).map((e) => ({
      title: e.title_en,
      date: e.date,
      location: e.location,
      description: e.description_en
    })),
    news: news.slice(0, MAX_NEWS).map((n) => ({
      title: n.title,
      excerpt: n.excerpt,
      date: n.date
    })),
    faq: faq.slice(0, MAX_FAQ).map((f) => ({
      question: f.question_en ?? '',
      answer: f.answer_en ?? ''
    }))
  }
}

// Serializes the context into a compact text block for the prompt.
export function formatContextForPrompt(context: PublicAiContext): string {
  const lines: string[] = []

  if (context.company) {
    lines.push('COMPANY:')
    if (context.company.name) lines.push(`Name: ${context.company.name}`)
    if (context.company.tagline) lines.push(`Tagline: ${context.company.tagline}`)
    if (context.company.shortDescription) lines.push(`Description: ${context.company.shortDescription}`)
    if (context.company.aboutText) lines.push(`About: ${context.company.aboutText}`)
    if (context.company.location) lines.push(`Location: ${context.company.location}`)
    if (context.company.foundedDate) lines.push(`Founded: ${context.company.foundedDate}`)
  }

  if (context.events.length > 0) {
    lines.push('', 'EVENTS:')
    for (const e of context.events) {
      const bits = [e.title]
      if (e.date) bits.push(`(${e.date})`)
      if (e.location) bits.push(`at ${e.location}`)
      lines.push(`- ${bits.join(' ')}${e.description ? `: ${e.description}` : ''}`)
    }
  }

  if (context.news.length > 0) {
    lines.push('', 'NEWS:')
    for (const n of context.news) {
      lines.push(`- ${n.title}${n.date ? ` (${n.date})` : ''}${n.excerpt ? `: ${n.excerpt}` : ''}`)
    }
  }

  if (context.faq.length > 0) {
    lines.push('', 'FAQ:')
    for (const f of context.faq) {
      lines.push(`Q: ${f.question}\nA: ${f.answer}`)
    }
  }

  if (lines.length === 0) return ''
  return lines.join('\n').slice(0, MAX_CONTEXT_CHARS)
}
