"use client"
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DbAlbum } from '../../lib/albums-server'
import ImageFilePicker, { type PickedFile } from './ImageFilePicker'
import { uploadImages, type UploadState } from '../../lib/uploadClient'
import { slugify } from '../../lib/slug'

export default function AlbumForm({ album, canEdit }: { album?: DbAlbum | null; canEdit: boolean }) {
  const router = useRouter()
  const isEdit = Boolean(album?.id)

  const [form, setForm] = useState({
    title_en: album?.title_en ?? '',
    slug: album?.slug ?? '',
    description_en: album?.description_en ?? '',
    published: album?.published ?? false
  })
  // The slug follows the title until the admin types their own. An existing
  // album starts "edited": renaming it must not silently change its public URL.
  const [slugEdited, setSlugEdited] = useState(isEdit)
  const [phase, setPhase] = useState<'idle' | 'saving' | 'uploading'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Photos picked while creating an album are uploaded once it exists. If some
  // fail, the album is not created a second time on retry: createdId pins it,
  // and only the files that did not finish are sent again.
  const [files, setFiles] = useState<PickedFile[]>([])
  const [states, setStates] = useState<Record<string, UploadState>>({})
  const [createdId, setCreatedId] = useState<string | null>(null)
  const coverSet = useRef(false)

  const busy = phase !== 'idle'
  const pending = files.filter((f) => states[f.id]?.status !== 'done')
  const progress = pending.length
    ? Math.round((pending.reduce((sum, f) => sum + (states[f.id]?.progress ?? 0), 0) / pending.length) * 100)
    : 0

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  async function saveDetails(slug: string): Promise<string | null> {
    const url = isEdit ? `/api/admin/albums/${album!.id}` : '/api/admin/albums'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        slug,
        description_en: form.description_en || null,
        published: form.published
      })
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.error || 'Unable to save.')
      return null
    }
    return isEdit ? album!.id : (data.data.id as string)
  }

  async function uploadPhotos(albumId: string): Promise<boolean> {
    setPhase('uploading')
    const outcomes = await uploadImages(
      pending.map((f) => ({ id: f.id, file: f.file })),
      { albumId, onUpdate: (id, state) => setStates((prev) => ({ ...prev, [id]: state })) }
    )
    const uploaded = outcomes.flatMap((o) => (o.ok && o.mediaId ? [o.mediaId] : []))

    if (uploaded.length > 0 && !coverSet.current) {
      coverSet.current = true
      await fetch(`/api/admin/albums/${albumId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_media_id: uploaded[0] })
      }).catch(() => null)
    }

    const failed = outcomes.length - uploaded.length
    if (failed > 0) {
      setError(`The album was created, but ${failed} photo${failed === 1 ? '' : 's'} failed to upload. Remove or replace the files marked in red and press “Retry uploads”, or continue to the album.`)
      return false
    }
    return true
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    let slug = form.slug
    if (!createdId) {
      if (!form.title_en.trim()) {
        setError('A title is required.')
        return
      }
      // Normalize whatever was typed, and rebuild from the title if cleared.
      slug = slugify(form.slug) || slugify(form.title_en)
      if (!slug) {
        setError('Enter a slug using English letters or numbers. One could not be generated from this title.')
        return
      }
      if (slug !== form.slug) setForm((f) => ({ ...f, slug }))
    }
    setError(null)

    try {
      let albumId = createdId
      if (!albumId) {
        setPhase('saving')
        albumId = await saveDetails(slug)
        if (!albumId) return
        if (!isEdit) setCreatedId(albumId)
      }

      if (!isEdit && pending.length > 0) {
        const allUploaded = await uploadPhotos(albumId)
        if (!allUploaded) {
          router.refresh()
          return
        }
      }

      router.push(`/admin/media/albums/${albumId}`)
      router.refresh()
    } catch {
      setError('Unable to save.')
    } finally {
      setPhase('idle')
    }
  }

  const detailsLocked = busy || Boolean(createdId)

  const submitLabel =
    phase === 'saving' ? (isEdit ? 'Saving…' : 'Creating…')
      : phase === 'uploading' ? `Uploading… ${progress}%`
        : isEdit ? 'Save'
          : createdId ? 'Retry uploads'
            : pending.length > 0 ? `Create album & upload ${pending.length} photo${pending.length === 1 ? '' : 's'}`
              : 'Create album'

  return (
    <form onSubmit={save} className="space-y-5">
      {error && <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-300" htmlFor="alb-title">Title *</label>
        <input
          id="alb-title"
          type="text"
          value={form.title_en}
          maxLength={200}
          disabled={detailsLocked}
          onChange={(e) => {
            const title = e.target.value
            setForm((f) => ({ ...f, title_en: title, slug: slugEdited ? f.slug : slugify(title) }))
          }}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300" htmlFor="alb-slug">Slug *</label>
        <input
          id="alb-slug"
          type="text"
          value={form.slug}
          maxLength={200}
          disabled={detailsLocked}
          onChange={(e) => {
            const value = e.target.value
            setForm((f) => ({ ...f, slug: value }))
            // Clearing the field hands control back to the title.
            setSlugEdited(value.trim() !== '')
          }}
          onBlur={() => setForm((f) => ({ ...f, slug: f.slug.trim() ? slugify(f.slug) : (isEdit ? f.slug : slugify(f.title_en)) }))}
          className={inputClass}
          placeholder="generated-from-the-title"
        />
        <p className="mt-1 text-xs text-gray-500">
          Public URL: /media/photos/<span className="text-gray-300">{form.slug || '<slug>'}</span>
          {!isEdit && !slugEdited && form.slug && ' · generated from the title, edit to customize'}
          {isEdit && ' · changing it changes the album’s public link'}
        </p>
        {!isEdit && !form.slug && form.title_en.trim() && !slugify(form.title_en) && (
          <p className="mt-1 text-xs text-amber-200/80">This title has no English letters or numbers to build a slug from. Type one, e.g. “tournament-2025”.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300" htmlFor="alb-desc">Description</label>
        <textarea id="alb-desc" rows={3} value={form.description_en} maxLength={2000} disabled={detailsLocked} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className={`${inputClass} resize-y`} />
      </div>

      <label className="flex items-center gap-3">
        <input type="checkbox" checked={form.published} disabled={detailsLocked} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-black/40 accent-primary" />
        <span className="text-sm font-medium text-gray-200">Published</span>
      </label>

      {!isEdit && (
        <div>
          <p className="text-sm font-medium text-gray-300">Photos</p>
          <p className="mb-3 mt-1 text-xs text-gray-500">Optional. Uploaded into the album when it is created; the first photo becomes its cover. You can add more later.</p>
          <ImageFilePicker files={files} onChange={setFiles} states={states} disabled={busy || !canEdit} />
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {createdId && !busy ? (
          <button type="button" onClick={() => router.push(`/admin/media/albums/${createdId}`)} className="btn btn-ghost">Continue to album</button>
        ) : (
          <button type="button" onClick={() => router.push('/admin/media/albums')} disabled={busy} className="btn btn-ghost">Cancel</button>
        )}
        <button type="submit" disabled={busy || !canEdit || (Boolean(createdId) && pending.length === 0)} className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  )
}
