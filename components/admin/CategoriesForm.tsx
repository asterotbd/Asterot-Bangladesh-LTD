"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import { Panel } from './Panel'
import type { DbCategory } from '../../lib/categories-server'

export default function CategoriesForm({ categories, canEdit, canDelete }: { categories: DbCategory[]; canEdit: boolean; canDelete: boolean }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<DbCategory | null>(null)
  const [deleting, setDeleting] = useState<DbCategory | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  const emptyForm = { name_en: '', name_bn: '', slug: '', type: 'project' }
  const [form, setForm] = useState(emptyForm)

  function openEdit(cat: DbCategory) {
    setEditing(cat)
    setForm({ name_en: cat.name_en, name_bn: cat.name_bn ?? '', slug: cat.slug ?? '', type: cat.type ?? 'project' })
    setFeedback(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!form.name_en.trim()) {
      setFeedback({ kind: 'error', message: 'A name is required.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        name_en: form.name_en,
        name_bn: form.name_bn || null,
        slug: form.slug || null,
        type: form.type || 'project'
      }
      const res = await fetch('/api/admin/content/categories', {
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
      const res = await fetch('/api/admin/content/categories', {
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
            New Category
          </button>
        )}
      </div>

      <Panel title="Categories">
        {categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No categories yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-white">{cat.name_en} {cat.name_bn && <span className="text-sm text-gray-500">({cat.name_bn})</span>}</p>
                  <p className="mt-0.5 text-sm text-gray-400">/{cat.slug || '—'}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {canEdit && (
                    <button type="button" onClick={() => openEdit(cat)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" onClick={() => setDeleting(cat)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {(adding || editing) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && (editing ? setEditing(null) : setAdding(false))} />
          <div role="dialog" aria-modal="true" aria-label="Category form" className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{editing ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="cat-name">Name *</label>
                <input id="cat-name" type="text" value={form.name_en} maxLength={100} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300" htmlFor="cat-name-bn">Name (Bangla)</label>
                  <input id="cat-name-bn" type="text" value={form.name_bn} maxLength={100} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300" htmlFor="cat-slug">Slug</label>
                  <input id="cat-slug" type="text" value={form.slug} maxLength={200} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="kebab-case" />
                </div>
              </div>
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
        title={`Delete "${deleting?.name_en ?? ''}"?`}
        description="This permanently removes the category. Events or news using it will keep their category_id but display without a category name."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}