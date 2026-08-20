"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Panel } from './Panel'
import type { DbHomepageSection } from '../../lib/homepage-server'
import type { DbEvent } from '../../lib/events-server'

type SectionInput = {
  section_key: string
  label: string
  description: string
  fields: { key: string; label: string; type: 'text' | 'textarea' | 'url' | 'boolean' | 'event'; max?: number }[]
}

const SECTION_SCHEMA: Record<string, SectionInput> = {
  hero: {
    section_key: 'hero',
    label: 'Hero',
    description: 'The first section visitors see on the homepage.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', max: 300 },
      { key: 'subtitle', label: 'Supporting text', type: 'textarea', max: 500 },
      { key: 'cta_text', label: 'CTA label', type: 'text', max: 200 },
      { key: 'cta_url', label: 'CTA link', type: 'url', max: 500 },
      { key: 'visible', label: 'Visible on homepage', type: 'boolean' }
    ]
  },
  capabilities: {
    section_key: 'capabilities',
    label: 'Capabilities',
    description: 'The heading and intro above the capabilities grid. The individual services are managed in Capabilities.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', max: 300 },
      { key: 'subtitle', label: 'Intro text', type: 'textarea', max: 500 },
      { key: 'cta_text', label: 'CTA label', type: 'text', max: 200 },
      { key: 'cta_url', label: 'CTA link', type: 'url', max: 500 },
      { key: 'visible', label: 'Visible on homepage', type: 'boolean' }
    ]
  },
  featured_event: {
    section_key: 'featured_event',
    label: 'Featured Event',
    description: 'The highlighted event section on the homepage.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', max: 300 },
      { key: 'subtitle', label: 'Description', type: 'textarea', max: 500 },
      { key: 'cta_text', label: 'CTA label', type: 'text', max: 200 },
      { key: 'cta_url', label: 'CTA link', type: 'url', max: 500 },
      { key: 'visible', label: 'Visible on homepage', type: 'boolean' }
    ]
  },
  companies: {
    section_key: 'companies',
    label: 'Companies',
    description: 'The heading above the companies marquee.',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', max: 300 },
      { key: 'visible', label: 'Visible on homepage', type: 'boolean' }
    ]
  }
}

export default function HomepageForm({
  sections,
  events,
  canEdit
}: {
  sections: (DbHomepageSection | null)[]
  events: DbEvent[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  async function save(key: string, formData: FormData) {
    if (busy) return
    const schema = SECTION_SCHEMA[key]
    const payload: Record<string, unknown> = { section_key: key }
    for (const field of schema.fields) {
      const value = formData.get(field.key)
      if (field.type === 'boolean') {
        payload[field.key] = value === 'on'
      } else if (field.type === 'event') {
        payload[field.key] = typeof value === 'string' && value ? value : null
      } else if (typeof value === 'string') {
        payload[field.key] = value
      }
    }
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/content/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to save.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Saved successfully.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to save.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
          {feedback.message}
        </div>
      )}

      {!canEdit && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
          You have read-only access to this page.
        </p>
      )}

      {sections.map((section) => {
        const schema = SECTION_SCHEMA[section?.section_key ?? '']
        if (!schema) return null
        return (
          <Panel key={schema.section_key} title={schema.label} description={schema.description}>
            <form action={save.bind(null, schema.section_key)} className="space-y-5">
              {schema.fields.map((field) => {
                const value = section ? section[field.key as keyof DbHomepageSection] : undefined
                if (field.type === 'boolean') {
                  return (
                    <label key={field.key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name={field.key}
                        defaultChecked={Boolean(value)}
                        disabled={!canEdit}
                        className="h-4 w-4 rounded border-white/20 bg-black/40 accent-primary"
                      />
                      <span className="text-sm font-medium text-gray-200">{field.label}</span>
                    </label>
                  )
                }
                return (
                  <label key={field.key} className="block">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.key}
                        rows={4}
                        maxLength={field.max}
                        defaultValue={typeof value === 'string' ? value : ''}
                        disabled={!canEdit}
                        className={`${inputClass} resize-y`}
                      />
                    ) : (
                      <input
                        type={field.type === 'url' ? 'url' : 'text'}
                        name={field.key}
                        maxLength={field.max}
                        defaultValue={typeof value === 'string' ? value : ''}
                        disabled={!canEdit}
                        className={inputClass}
                      />
                    )}
                  </label>
                )
              })}

              <div className="flex items-center justify-end gap-3">
                {canEdit && (
                  <button type="submit" disabled={busy} className="btn btn-primary">
                    {busy ? 'Saving…' : 'Save changes'}
                  </button>
                )}
              </div>
            </form>
          </Panel>
        )
      })}
    </div>
  )
}