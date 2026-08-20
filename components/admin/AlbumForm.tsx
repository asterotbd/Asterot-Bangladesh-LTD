"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DbAlbum } from '../../lib/albums-server'

export default function AlbumForm({ album, canEdit }: { album?: DbAlbum | null; canEdit: boolean }) {
  const router = useRouter()
  const isEdit = Boolean(album?.id)

  const [form, setForm] = useState({
    title_en: album?.title_en ?? '',
    title_bn: album?.title_bn ?? '',
    slug: album?.slug ?? '',
    description_en: album?.description_en ?? '',
    published: album?.published ?? false
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!form.title_en.trim()) {
      setError('A title is required.')
      return
    }
    if (!form.slug.trim()) {
      setError('A slug is required (used in the public URL).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const url = isEdit ? `/api/admin/albums/${album!.id}` : '/api/admin/albums'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          title_bn: form.title_bn || null,
          description_en: form.description_en || null,
          published: form.published
        })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to save.')
        return
      }
      if (isEdit) {
        router.push(`/admin/media/albums/${album!.id}`)
      } else {
        router.push(`/admin/media/albums/${data.data.id}`)
      }
      router.refresh()
    } catch {
      setError('Unable to save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {error && <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{error}</div>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="alb-title">Title *</label>
          <input id="alb-title" type="text" value={form.title_en} maxLength={200} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300" htmlFor="alb-title-bn">Title (Bangla)</label>
          <input id="alb-title-bn" type="text" value={form.title_bn} maxLength={200} onChange={(e) => setForm({ ...form, title_bn: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300" htmlFor="alb-slug">Slug *</label>
        <input id="alb-slug" type="text" value={form.slug} maxLength={200} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="kebab-case-slug" />
        <p className="mt-1 text-xs text-gray-500">Used in the public URL: /media/photos/&lt;slug&gt;</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300" htmlFor="alb-desc">Description</label>
        <textarea id="alb-desc" rows={3} value={form.description_en} maxLength={2000} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className={`${inputClass} resize-y`} />
      </div>

      <label className="flex items-center gap-3">
        <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-black/40 accent-primary" />
        <span className="text-sm font-medium text-gray-200">Published</span>
      </label>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/admin/media/albums')} disabled={busy} className="btn btn-ghost">Cancel</button>
        <button type="submit" disabled={busy || !canEdit} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  )
}