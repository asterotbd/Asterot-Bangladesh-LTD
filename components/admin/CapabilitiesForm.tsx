"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import { Panel } from './Panel'
import type { DbService } from '../../lib/services-server'

export default function CapabilitiesForm({ services, canEdit }: { services: DbService[]; canEdit: boolean }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<DbService | null>(null)
  const [deleting, setDeleting] = useState<DbService | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  const emptyForm = { title_en: '', title_bn: '', short_description_en: '', description_en: '', published: false }
  const [form, setForm] = useState(emptyForm)

  function openEdit(service: DbService) {
    setEditing(service)
    setForm({
      title_en: service.title_en ?? '',
      title_bn: service.title_bn ?? '',
      short_description_en: service.short_description_en ?? '',
      description_en: service.description_en ?? '',
      published: Boolean(service.published)
    })
    setFeedback(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!form.title_en.trim()) {
      setFeedback({ kind: 'error', message: 'A title is required.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        title_en: form.title_en,
        title_bn: form.title_bn || null,
        short_description_en: form.short_description_en || null,
        description_en: form.description_en || null,
        published: form.published
      }
      const res = await fetch('/api/admin/content/capabilities', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to save.' })
        return
      }
      setEditing(null)
      setAdding(false)
      setForm(emptyForm)
      setFeedback({ kind: 'success', message: 'Saved successfully.' })
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
      const res = await fetch('/api/admin/content/capabilities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to delete.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Deleted successfully.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to delete.' })
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

      <div className="flex justify-end">
        {canEdit && !adding && !editing && (
          <button type="button" onClick={() => { setAdding(true); setFeedback(null); }} className="btn btn-primary">
            New Capability
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {services.map((service) => (
          <div key={service.id} className="rounded-2xl border border-white/10 bg-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-medium text-white">{service.title_en || 'Untitled'}</h3>
                <p className="mt-1 text-sm text-gray-400 line-clamp-2">{service.short_description_en || service.description_en || '—'}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${service.published ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
                {service.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              {canEdit && (
                <>
                  <button type="button" onClick={() => openEdit(service)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                    Edit
                  </button>
                  <button type="button" onClick={() => setDeleting(service)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                    Delete
                  </button>
                </>
              )}
              <span className="ml-auto text-xs text-gray-500">Order: {service.display_order ?? 0}</span>
            </div>
          </div>
        ))}
      </div>

      {(adding || editing) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && (editing ? setEditing(null) : setAdding(false))} />
          <div role="dialog" aria-modal="true" aria-label="Capability form" className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{editing ? 'Edit Capability' : 'New Capability'}</h3>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="cap-title">Title *</label>
                <input id="cap-title" type="text" value={form.title_en} maxLength={200} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="cap-title-bn">Title (Bangla)</label>
                <input id="cap-title-bn" type="text" value={form.title_bn} maxLength={200} onChange={(e) => setForm({ ...form, title_bn: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="cap-short">Short description</label>
                <textarea id="cap-short" rows={3} value={form.short_description_en} maxLength={500} onChange={(e) => setForm({ ...form, short_description_en: e.target.value })} className={`${inputClass} resize-y`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="cap-desc">Description</label>
                <textarea id="cap-desc" rows={4} value={form.description_en} maxLength={5000} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className={`${inputClass} resize-y`} />
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 rounded border-white/20 bg-black/40 accent-primary" />
                <span className="text-sm font-medium text-gray-200">Published</span>
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => (editing ? setEditing(null) : setAdding(false))} disabled={busy} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete "${deleting?.title_en ?? ''}"?`}
        description="This permanently removes the capability. This action cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}