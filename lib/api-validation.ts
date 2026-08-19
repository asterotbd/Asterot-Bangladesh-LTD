import {
  isDateOnlyString,
  isIsoDateString,
  isNonNegativeInteger,
  isSlug,
  isTimeString,
  isValidUuid
} from './api-utils'

export type ValidationResult = { error: string } | { fields: Record<string, unknown> }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function rejectUnknownKeys(body: Record<string, unknown>, allowed: Record<string, true>): string | null {
  for (const key of Object.keys(body)) {
    if (!allowed[key]) return 'Invalid payload field.'
  }
  return null
}

const EVENT_FIELDS: Record<string, true> = {
  title_en: true,
  title_bn: true,
  slug: true,
  description_en: true,
  description_bn: true,
  category_id: true,
  date: true,
  time: true,
  location: true,
  registration_deadline: true,
  capacity: true,
  published: true
}

const NEWS_FIELDS: Record<string, true> = {
  title_en: true,
  title_bn: true,
  slug: true,
  subtitle_en: true,
  subtitle_bn: true,
  excerpt_en: true,
  excerpt_bn: true,
  content_en: true,
  content_bn: true,
  category_id: true,
  published: true,
  published_at: true
}

const EVENT_TEXT_LIMITS: Record<string, number> = {
  title_bn: 200,
  description_en: 20000,
  description_bn: 20000,
  location: 200
}

const NEWS_TEXT_LIMITS: Record<string, number> = {
  title_bn: 200,
  subtitle_en: 300,
  subtitle_bn: 300,
  excerpt_en: 500,
  excerpt_bn: 500,
  content_en: 50000,
  content_bn: 50000
}

function validateSlug(body: Record<string, unknown>, fields: Record<string, unknown>): string | null {
  if (!('slug' in body)) return null
  const value = body.slug
  if (value === null || value === '') {
    // Explicitly blank: the route regenerates it from the title.
    fields.slug = ''
    return null
  }
  if (typeof value !== 'string') return 'Invalid slug.'
  const slug = value.trim()
  if (slug.length > 200) return 'slug is too long.'
  if (!isSlug(slug)) return 'Invalid slug.'
  fields.slug = slug
  return null
}

function validateCategoryId(body: Record<string, unknown>, fields: Record<string, unknown>): string | null {
  if (!('category_id' in body)) return null
  const value = body.category_id
  if (value === null || value === '') {
    fields.category_id = null
    return null
  }
  if (typeof value === 'string' && isValidUuid(value)) {
    fields.category_id = value
    return null
  }
  return 'Invalid category_id.'
}

function validatePublished(body: Record<string, unknown>, fields: Record<string, unknown>): string | null {
  if (!('published' in body)) return null
  if (typeof body.published !== 'boolean') return 'Invalid published.'
  fields.published = body.published
  return null
}

function validateOptionalText(
  body: Record<string, unknown>,
  fields: Record<string, unknown>,
  key: string,
  max: number
): string | null {
  if (!(key in body)) return null
  const value = body[key]
  if (value === null) {
    fields[key] = null
    return null
  }
  if (typeof value !== 'string') return `Invalid ${key}.`
  const trimmed = value.trim()
  if (trimmed === '') {
    fields[key] = null
    return null
  }
  if (trimmed.length > max) return `${key} is too long.`
  fields[key] = trimmed
  return null
}

export function validateEventPayload(body: unknown, opts: { requireTitle: boolean }): ValidationResult {
  if (!isPlainObject(body)) return { error: 'Invalid payload.' }
  const unknownKeyError = rejectUnknownKeys(body, EVENT_FIELDS)
  if (unknownKeyError) return { error: unknownKeyError }
  if (Object.keys(body).length === 0) return { error: 'Invalid payload.' }

  const fields: Record<string, unknown> = {}

  if (opts.requireTitle || 'title_en' in body) {
    const value = body.title_en
    if (typeof value !== 'string' || !value.trim()) {
      return { error: opts.requireTitle ? 'title_en is required.' : 'title_en cannot be empty.' }
    }
    const title = value.trim()
    if (title.length > 200) return { error: 'title_en is too long.' }
    fields.title_en = title
  }

  for (const key of ['title_bn', 'description_en', 'description_bn', 'location']) {
    const err = validateOptionalText(body, fields, key, EVENT_TEXT_LIMITS[key])
    if (err) return { error: err }
  }

  const slugError = validateSlug(body, fields)
  if (slugError) return { error: slugError }

  const categoryError = validateCategoryId(body, fields)
  if (categoryError) return { error: categoryError }

  if ('date' in body) {
    const value = body.date
    if (value === null || value === '') {
      fields.date = null
    } else if (typeof value === 'string' && isDateOnlyString(value)) {
      fields.date = value
    } else {
      return { error: 'Invalid date.' }
    }
  }

  if ('time' in body) {
    const value = body.time
    if (value === null || value === '') {
      fields.time = null
    } else if (typeof value === 'string' && isTimeString(value)) {
      fields.time = value
    } else {
      return { error: 'Invalid time.' }
    }
  }

  if ('registration_deadline' in body) {
    const value = body.registration_deadline
    if (value === null || value === '') {
      fields.registration_deadline = null
    } else if (typeof value === 'string' && isIsoDateString(value)) {
      fields.registration_deadline = value
    } else {
      return { error: 'Invalid registration_deadline.' }
    }
  }

  if ('capacity' in body) {
    const value = body.capacity
    if (value === null || value === '') {
      fields.capacity = null
    } else if (typeof value === 'number' && isNonNegativeInteger(value)) {
      fields.capacity = value
    } else if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed) && isNonNegativeInteger(parsed)) {
        fields.capacity = parsed
      } else {
        return { error: 'Invalid capacity.' }
      }
    } else {
      return { error: 'Invalid capacity.' }
    }
  }

  const publishedError = validatePublished(body, fields)
  if (publishedError) return { error: publishedError }

  return { fields }
}

export function validateNewsPayload(body: unknown, opts: { requireTitle: boolean }): ValidationResult {
  if (!isPlainObject(body)) return { error: 'Invalid payload.' }
  const unknownKeyError = rejectUnknownKeys(body, NEWS_FIELDS)
  if (unknownKeyError) return { error: unknownKeyError }
  if (Object.keys(body).length === 0) return { error: 'Invalid payload.' }

  const fields: Record<string, unknown> = {}

  if (opts.requireTitle || 'title_en' in body) {
    const value = body.title_en
    if (typeof value !== 'string' || !value.trim()) {
      return { error: opts.requireTitle ? 'title_en is required.' : 'title_en cannot be empty.' }
    }
    const title = value.trim()
    if (title.length > 200) return { error: 'title_en is too long.' }
    fields.title_en = title
  }

  for (const key of ['title_bn', 'subtitle_en', 'subtitle_bn', 'excerpt_en', 'excerpt_bn', 'content_en', 'content_bn']) {
    const err = validateOptionalText(body, fields, key, NEWS_TEXT_LIMITS[key])
    if (err) return { error: err }
  }

  const slugError = validateSlug(body, fields)
  if (slugError) return { error: slugError }

  const categoryError = validateCategoryId(body, fields)
  if (categoryError) return { error: categoryError }

  const publishedError = validatePublished(body, fields)
  if (publishedError) return { error: publishedError }

  if ('published_at' in body) {
    const value = body.published_at
    if (value === null || value === '') {
      fields.published_at = null
    } else if (typeof value === 'string' && isIsoDateString(value)) {
      fields.published_at = value
    } else {
      return { error: 'Invalid published_at.' }
    }
  }

  return { fields }
}

const COMPANY_FIELDS: Record<string, true> = {
  name_en: true,
  founded_date: true,
  tagline_en: true,
  slogan_en: true,
  short_description_en: true
}

const COMPANY_TEXT_LIMITS: Record<string, number> = {
  name_en: 200,
  tagline_en: 300,
  slogan_en: 300,
  short_description_en: 2000
}

export function validateCompanyPayload(body: unknown): ValidationResult {
  if (!isPlainObject(body)) return { error: 'Invalid payload.' }

  // Note: the admin company form submits the full company_info row (including
  // read-only columns such as id/created_at), so unknown keys are intentionally
  // ignored here rather than rejected.
  const fields: Record<string, unknown> = {}
  let found = false

  for (const key of Object.keys(COMPANY_FIELDS)) {
    if (!(key in body)) continue
    found = true
    const value = body[key]

    if (key === 'founded_date') {
      if (value === null || value === '') {
        fields[key] = value
        continue
      }
      if (typeof value !== 'string' || !isDateOnlyString(value)) {
        return { error: 'Invalid founded_date.' }
      }
      fields[key] = value
      continue
    }

    if (value === null) {
      fields[key] = null
      continue
    }
    if (typeof value !== 'string') return { error: `Invalid ${key}.` }
    if (value.length > COMPANY_TEXT_LIMITS[key]) return { error: `${key} is too long.` }
    fields[key] = value
  }

  if (!found) return { error: 'Invalid payload.' }
  return { fields }
}