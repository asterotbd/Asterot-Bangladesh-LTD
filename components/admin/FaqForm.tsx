"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import { Panel } from './Panel'
import type { DbFaqItem } from '../../lib/faq-server'

export default function FaqForm({ items, categories, canEdit }: { items: DbFaqItem[]; categories: string[]; canEdit: boolean }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<DbFaqItem | null>(null)
  const [deleting, setDeleting] = useState<DbFaqItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50'

  const emptyForm = { question_en: '', answer_en: '', category: '', status: 'draft' as string }
  const [form, setForm] = useState(emptyForm)

  function openEdit(item: DbFaqItem) {
    setEditing(item)
    setForm({
      question_en: item.question_en ?? '',
      answer_en: item.answer_en ?? '',
      category: item.category ?? '',
      status: item.status ?? 'draft'
    })
    setFeedback(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!form.question_en.trim() || !form.answer_en.trim()) {
      setFeedback({ kind: 'error', message: 'Question and answer are required.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const payload = {
        ...(editing ? {} : { display_order: items.length }),
        question_en: form.question_en,
        answer_en: form.answer_en,
        category: form.category || null,
        status: form.status
      }
      const res = await fetch(editing ? `/api/admin/faq/${editing.id}` : '/api/admin/faq', {
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
      const res = await fetch(`/api/admin/faq/${target.id}`, { method: 'DELETE' })
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
            New FAQ Item
          </button>
        )}
      </div>

      <Panel title="FAQ Items">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No FAQ items yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{item.question_en}</p>
                  <p className="mt-1 text-sm text-gray-400 line-clamp-2">{item.answer_en}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.category && <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">{item.category}</span>}
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${item.status === 'published' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : item.status === 'archived' ? 'border-gray-400/25 bg-gray-400/10 text-gray-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
                      {item.status === 'published' ? 'Published' : item.status === 'archived' ? 'Archived' : 'Draft'}
                    </span>
                    <span className="text-xs text-gray-600">Order: {item.display_order ?? 0}</span>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                      Edit
                    </button>
                    <button type="button" onClick={() => setDeleting(item)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {(adding || editing) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && (editing ? setEditing(null) : setAdding(false))} />
          <div role="dialog" aria-modal="true" aria-label="FAQ form" className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{editing ? 'Edit FAQ Item' : 'New FAQ Item'}</h3>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="faq-question">Question *</label>
                <input id="faq-question" type="text" value={form.question_en} maxLength={500} onChange={(e) => setForm({ ...form, question_en: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300" htmlFor="faq-answer">Answer *</label>
                <textarea id="faq-answer" rows={5} value={form.answer_en} maxLength={5000} onChange={(e) => setForm({ ...form, answer_en: e.target.value })} className={`${inputClass} resize-y`} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300" htmlFor="faq-category">Category</label>
                  <input id="faq-category" type="text" list="faq-categories" value={form.category} maxLength={100} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} placeholder="e.g. Events" />
                  <datalist id="faq-categories">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300" htmlFor="faq-status">Status</label>
                  <select id="faq-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
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
        title={`Delete FAQ item?`}
        description={`"${deleting?.question_en ?? ''}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}