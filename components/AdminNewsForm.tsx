"use client"
import { useEffect, useState } from 'react'
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
  status?: 'draft' | 'published' | 'archived'
  featured_image?: string | null
}

type Category = {
  id: string
  name_en: string | null
  slug: string | null
}

type MediaItem = {
  id: string
  public_url: string | null
  alt_en: string | null
}

export default function AdminNewsForm({ news, categories }: { news?: AdminNews | null, categories: Category[] }) {
  const router = useRouter()
  const isEdit = Boolean(news?.id)

  const [featuredPreviewUrl, setFeaturedPreviewUrl] = useState<string | null>(null)
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
    published_at: news?.published_at || '',
    status: news?.status ?? (news?.published ? 'published' : 'draft'),
    featured_image: news?.featured_image || null
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMedia, setPickerMedia] = useState<MediaItem[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerFeedback, setPickerFeedback] = useState<string | undefined>()

  const onChange = (key: keyof AdminNews, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const pickFeatured = (item: MediaItem) => {
    setForm(prev => ({ ...prev, featured_image: item.id }))
    setFeaturedPreviewUrl(item.public_url)
    setPickerOpen(false)
  }

  const removeFeatured = () => {
    setForm(prev => ({ ...prev, featured_image: null }))
    setFeaturedPreviewUrl(null)
  }

  const onStatusChange = (value: string) => {
    const status = value as AdminNews['status']
    setForm(prev => ({
      ...prev,
      status,
      published: status === 'published'
    }))
  }

  const onPublishedChange = (checked: boolean) => {
    setForm(prev => ({
      ...prev,
      published: checked,
      status: checked ? 'published' : 'draft'
    }))
  }

  const openPicker = async () => {
    setPickerOpen(true)
    setPickerLoading(true)
    setPickerFeedback(undefined)
    try {
      const res = await fetch('/api/admin/media?type=photo&perPage=100')
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.data) {
        setPickerFeedback(data?.error || 'Unable to load media.')
        return
      }
      setPickerMedia((data.data as MediaItem[]).filter(m => m.public_url))
    } catch {
      setPickerFeedback('Unable to load media.')
    } finally {
      setPickerLoading(false)
    }
  }

  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  useEffect(() => {
    if (previewLoaded || !isEdit || !news?.featured_image) return
    setPreviewLoaded(true)
    fetch(`/api/admin/media/${news.featured_image}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const url = (data as { data?: MediaItem } | null)?.data?.public_url ?? null
        if (url) setFeaturedPreviewUrl(url)
        else setPreviewError(true)
      })
      .catch(() => setPreviewError(true))
  }, [previewLoaded, isEdit, news])

  const save = async () => {
    setSaving(true)
    setError(undefined)
    if (!form.title_en?.trim()) {
      setError('Title (EN) is required.')
      setSaving(false)
      return
    }
    const payload = {
      ...form,
      title_bn: form.title_bn?.trim() ? form.title_bn : null,
      excerpt_en: form.excerpt_en?.trim() ? form.excerpt_en : null,
      excerpt_bn: form.excerpt_bn?.trim() ? form.excerpt_bn : null,
      content_en: form.content_en?.trim() ? form.content_en : null,
      content_bn: form.content_bn?.trim() ? form.content_bn : null,
      category_id: form.category_id ? form.category_id : null,
      featured_image: form.featured_image || null,
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
          <input required value={form.title_en || ''} onChange={e => onChange('title_en', e.target.value)} className={inputClass} />
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
        <label className="block text-sm font-medium text-gray-300">Status
          <select value={form.status || 'draft'} onChange={e => onStatusChange(e.target.value)} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <label className="block text-sm font-medium text-gray-300">Featured image
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {form.featured_image ? (
              featuredPreviewUrl ? (
                <button type="button" onClick={() => void openPicker()} className="relative block h-24 w-36 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPreviewUrl}
                    alt="Featured image preview"
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : previewError ? (
                <button type="button" onClick={() => void openPicker()} className="flex h-24 w-36 items-center justify-center rounded-xl border border-white/10 text-sm text-gray-500">Image unavailable</button>
              ) : (
                <div className="flex h-24 w-36 items-center justify-center rounded-xl border border-white/10 text-sm text-gray-500">Loading…</div>
              )
            ) : (
              <div className="flex h-24 w-36 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">No image</div>
            )}
            <div className="space-y-2">
              <Button variant="ghost" onClick={() => void openPicker()}>Choose from media</Button>
              {form.featured_image && (
                <button type="button" onClick={removeFeatured} className="block text-xs text-red-300 hover:underline">
                  Remove featured image
                </button>
              )}
            </div>
          </div>
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-gray-300">
        <input type="checkbox" checked={Boolean(form.published)} onChange={e => onPublishedChange(e.target.checked)} className="h-4 w-4" />
        Published
      </label>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        <Button variant="ghost" onClick={() => router.push('/admin/news')}>Cancel</Button>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !saving && setPickerOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Choose featured image" className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Choose Featured Image</h3>
            <p className="mt-1 text-sm text-gray-400">Pick a photo from the media library to use as this article&apos;s featured image.</p>
            {pickerFeedback && <p className="mt-2 text-sm text-amber-200">{pickerFeedback}</p>}
            <div className="mt-4 flex-1 overflow-y-auto">
              {pickerLoading ? (
                <p className="py-10 text-center text-sm text-gray-500">Loading media…</p>
              ) : pickerMedia.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">No photos in the media library yet. Upload some from the Media page first.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {pickerMedia.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => pickFeatured(m)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${form.featured_image === m.id ? 'border-primary' : 'border-transparent'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.public_url ?? ''} alt={m.alt_en ?? ''} className="h-full w-full object-cover" />
                      {form.featured_image === m.id && <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-xs text-white">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setPickerOpen(false)} disabled={saving} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
