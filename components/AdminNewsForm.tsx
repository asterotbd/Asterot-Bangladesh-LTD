"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from './Button'

type AdminNews = {
  id?: string
  title_en: string
  title_bn?: string | null
  slug: string
  excerpt_en?: string | null
  excerpt_bn?: string | null
  content_en?: string | null
  content_bn?: string | null
  category_id?: string | null
  published?: boolean
  published_at?: string | null
}

type Category = {
  id: string
  name_en: string | null
  slug: string | null
}

export default function AdminNewsForm({ news, categories }: { news?: AdminNews | null, categories: Category[] }) {
  const router = useRouter()
  const isEdit = Boolean(news?.id)

  const [form, setForm] = useState<AdminNews>({
    title_en: news?.title_en || '',
    title_bn: news?.title_bn || '',
    slug: news?.slug || '',
    excerpt_en: news?.excerpt_en || '',
    excerpt_bn: news?.excerpt_bn || '',
    content_en: news?.content_en || '',
    content_bn: news?.content_bn || '',
    category_id: news?.category_id || '',
    published: news?.published ?? false,
    published_at: news?.published_at || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const onChange = (key: keyof AdminNews, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError(undefined)
    const payload = {
      ...form,
      title_bn: form.title_bn?.trim() ? form.title_bn : null,
      excerpt_en: form.excerpt_en?.trim() ? form.excerpt_en : null,
      excerpt_bn: form.excerpt_bn?.trim() ? form.excerpt_bn : null,
      content_en: form.content_en?.trim() ? form.content_en : null,
      content_bn: form.content_bn?.trim() ? form.content_bn : null,
      category_id: form.category_id ? form.category_id : null,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null
    }
    try {
      const url = isEdit ? `/api/admin/news/${news!.id}` : '/api/admin/news'
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
      router.push('/admin/news')
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-300">Slug
          <input value={form.slug || ''} onChange={e => onChange('slug', e.target.value)} className={inputClass} placeholder="kebab-case-slug" />
        </label>
        <label className="block text-sm font-medium text-gray-300">Category
          <select value={form.category_id || ''} onChange={e => onChange('category_id', e.target.value)} className={inputClass}>
            <option value="">No category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name_en || c.slug}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-300">Excerpt (EN)
        <textarea value={form.excerpt_en || ''} onChange={e => onChange('excerpt_en', e.target.value)} className={inputClass} rows={2} />
      </label>
      <label className="block text-sm font-medium text-gray-300">Excerpt (BN)
        <textarea value={form.excerpt_bn || ''} onChange={e => onChange('excerpt_bn', e.target.value)} className={inputClass} rows={2} />
      </label>

      <label className="block text-sm font-medium text-gray-300">Content (EN)
        <textarea value={form.content_en || ''} onChange={e => onChange('content_en', e.target.value)} className={inputClass} rows={8} />
      </label>
      <label className="block text-sm font-medium text-gray-300">Content (BN)
        <textarea value={form.content_bn || ''} onChange={e => onChange('content_bn', e.target.value)} className={inputClass} rows={8} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-300">Published at
          <input type="datetime-local" value={form.published_at || ''} onChange={e => onChange('published_at', e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-gray-300">
        <input type="checkbox" checked={Boolean(form.published)} onChange={e => onChange('published', e.target.checked)} className="h-4 w-4" />
        Published
      </label>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        <Button variant="ghost" onClick={() => router.push('/admin/news')}>Cancel</Button>
      </div>
    </div>
  )
}
