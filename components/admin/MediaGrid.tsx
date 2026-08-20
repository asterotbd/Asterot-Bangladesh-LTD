"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import type { DbMedia } from '../../lib/media-server'

export default function MediaGrid({ items, canManage }: { items: DbMedia[]; canManage: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState<DbMedia | null>(null)
  const [deleting, setDeleting] = useState<DbMedia | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25'

  function openEdit(item: DbMedia) {
    setEditing(item)
    setValues({
      alt_en: item.alt_en ?? '',
      alt_bn: item.alt_bn ?? '',
      caption_en: item.caption_en ?? '',
      caption_bn: item.caption_bn ?? '',
      category: item.category ?? ''
    })
    setFeedback(null)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/media/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt_en: values.alt_en,
          alt_bn: values.alt_bn,
          caption_en: values.caption_en,
          caption_bn: values.caption_bn,
          category: values.category
        })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to save.' })
        return
      }
      setEditing(null)
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to save.' })
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleting || busy) return
    const target = deleting
    setDeleting(null)
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/media/${target.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to delete.' })
        return
      }
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to delete.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const isVideo = item.type === 'video' || item.type === 'embed'
          return (
            <div key={item.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-panel">
              <div className="flex aspect-video items-center justify-center overflow-hidden bg-black/40">
                {isVideo ? (
                  <span className="text-xs text-gray-500">{item.provider === 'youtube' ? 'YouTube' : item.type}</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.public_url ?? ''}
                    alt={item.alt_en ?? item.caption_en ?? 'Media'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="space-y-1 p-4">
                <p className="truncate text-sm font-medium text-white">{item.alt_en || item.caption_en || 'Untitled'}</p>
                <p className="text-xs text-gray-500">{item.category || 'Uncategorized'} · {item.type}</p>
                {canManage && (
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleting(item)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && setEditing(null)} />
          <div role="dialog" aria-modal="true" aria-label="Edit media" className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Edit Media</h3>
            <form onSubmit={saveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="edit-alt">Alt text</label>
                <input id="edit-alt" type="text" value={values.alt_en ?? ''} onChange={(e) => setValues((v) => ({ ...v, alt_en: e.target.value }))} maxLength={300} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="edit-alt-bn">Alt text (BN)</label>
                <input id="edit-alt-bn" type="text" value={values.alt_bn ?? ''} onChange={(e) => setValues((v) => ({ ...v, alt_bn: e.target.value }))} maxLength={300} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="edit-caption">Caption</label>
                <input id="edit-caption" type="text" value={values.caption_en ?? ''} onChange={(e) => setValues((v) => ({ ...v, caption_en: e.target.value }))} maxLength={500} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="edit-caption-bn">Caption (BN)</label>
                <input id="edit-caption-bn" type="text" value={values.caption_bn ?? ''} onChange={(e) => setValues((v) => ({ ...v, caption_bn: e.target.value }))} maxLength={500} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="edit-category">Category</label>
                <input id="edit-category" type="text" value={values.category ?? ''} onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))} maxLength={120} className={inputClass} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditing(null)} disabled={busy} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this media item?"
        description="This permanently deletes the file and its metadata. This action cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}