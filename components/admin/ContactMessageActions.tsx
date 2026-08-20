"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CONTACT_STATUSES } from '../../lib/contact-server'
import ConfirmDialog from './ConfirmDialog'

export default function ContactMessageActions({ messageId, currentStatus, onDeleted }: { messageId: string; currentStatus: string; onDeleted?: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  const options = CONTACT_STATUSES.filter((value) => value !== currentStatus)

  async function changeStatus(status: string) {
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to update the message.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Status updated.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to update the message.' })
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (busy) return
    setConfirmingDelete(false)
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to delete the message.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Message deleted.' })
      onDeleted?.()
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to delete the message.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <select
          aria-label="Change message status"
          value=""
          onChange={(e) => {
            if (e.target.value) void changeStatus(e.target.value)
          }}
          disabled={busy}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-gray-200 outline-none transition focus:border-primary disabled:opacity-50"
        >
          <option value="">Set status…</option>
          {options.map((value) => (
            <option key={value} value={value}>
              {value === 'read' ? 'Mark read' : value === 'handled' ? 'Mark handled' : value === 'archived' ? 'Archive' : 'Mark new'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={busy}
          className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {feedback && (
        <p className={`text-xs ${feedback.kind === 'success' ? 'text-emerald-200' : 'text-amber-200/80'}`}>{feedback.message}</p>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this message?"
        description="This permanently deletes the contact message. This action cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}