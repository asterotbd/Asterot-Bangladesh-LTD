"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from './Button'

type AdminEvent = {
  id?: string
  title_en: string
  title_bn?: string | null
  slug: string
  description_en?: string | null
  description_bn?: string | null
  category_id?: string | null
  date?: string | null
  time?: string | null
  location?: string | null
  registration_deadline?: string | null
  capacity?: number | null
  published?: boolean
}

type Category = {
  id: string
  name_en: string | null
  slug: string | null
}

function toLocalInput(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminEventForm({ event, categories }: { event?: AdminEvent | null, categories: Category[] }) {
  const router = useRouter()
  const isEdit = Boolean(event?.id)

  const [form, setForm] = useState<AdminEvent>({
    title_en: event?.title_en || '',
    title_bn: event?.title_bn || '',
    slug: event?.slug || '',
    description_en: event?.description_en || '',
    description_bn: event?.description_bn || '',
    category_id: event?.category_id || '',
    date: event?.date || '',
    time: (event?.time || '').slice(0, 5),
    location: event?.location || '',
    registration_deadline: toLocalInput(event?.registration_deadline),
    capacity: event?.capacity ?? null,
    published: event?.published ?? false
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const onChange = (key: keyof AdminEvent, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError(undefined)
    const timeValue = form.time?.trim() ? `${form.time.trim()}:00` : null
    const deadlineValue = form.registration_deadline
      ? new Date(form.registration_deadline).toISOString()
      : null
    const payload = {
      ...form,
      title_bn: form.title_bn?.trim() ? form.title_bn : null,
      description_en: form.description_en?.trim() ? form.description_en : null,
      description_bn: form.description_bn?.trim() ? form.description_bn : null,
      category_id: form.category_id ? form.category_id : null,
      time: timeValue,
      location: form.location?.trim() ? form.location : null,
      registration_deadline: deadlineValue,
      capacity: form.capacity ? Number(form.capacity) : null,
      date: form.date ? form.date : null
    }
    try {
      const url = isEdit ? `/api/admin/events/${event!.id}` : '/api/admin/events'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Save failed')
        setSaving(false)
        return
      }
      router.push('/admin/events')
      router.refresh()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25'

  return (
    <div className="w-full max-w-[min(70rem,100%)] space-y-4">
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-300">Title (EN) *
          <input value={form.title_en || ''} onChange={e => onChange('title_en', e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-300">Title (BN)
          <input value={form.title_bn || ''} onChange={e => onChange('title_bn', e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-300">Slug
        <input value={form.slug || ''} onChange={e => onChange('slug', e.target.value)} className={inputClass} placeholder="kebab-case-slug" />
      </label>

      <label className="block text-sm font-medium text-gray-300">Description (EN)
        <textarea value={form.description_en || ''} onChange={e => onChange('description_en', e.target.value)} className={inputClass} rows={3} />
      </label>
      <label className="block text-sm font-medium text-gray-300">Description (BN)
        <textarea value={form.description_bn || ''} onChange={e => onChange('description_bn', e.target.value)} className={inputClass} rows={3} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-300">Category
          <select value={form.category_id || ''} onChange={e => onChange('category_id', e.target.value)} className={inputClass}>
            <option value="">No category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name_en || c.slug}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-300">Location
          <input value={form.location || ''} onChange={e => onChange('location', e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-gray-300">Date
          <input type="date" value={form.date || ''} onChange={e => onChange('date', e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-300">Time
          <input type="time" value={form.time || ''} onChange={e => onChange('time', e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-300">Capacity
          <input type="number" value={form.capacity ?? ''} onChange={e => onChange('capacity', e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-300">Registration deadline
        <input type="datetime-local" value={form.registration_deadline || ''} onChange={e => onChange('registration_deadline', e.target.value)} className={inputClass} />
      </label>

      <label className="flex items-center gap-3 text-sm font-medium text-gray-300">
        <input type="checkbox" checked={Boolean(form.published)} onChange={e => onChange('published', e.target.checked)} className="h-4 w-4" />
        Published
      </label>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        <Button variant="ghost" onClick={() => router.push('/admin/events')}>Cancel</Button>
      </div>
    </div>
  )
}
