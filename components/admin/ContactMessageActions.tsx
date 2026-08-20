"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CONTACT_STATUSES } from '../../lib/contact-server'

export default function ContactMessageActions({ messageId, currentStatus }: { messageId: string; currentStatus: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
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

  return (
    <div className="flex flex-col items-end gap-1.5">
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
      {feedback && (
        <p className={`text-xs ${feedback.kind === 'success' ? 'text-emerald-200' : 'text-amber-200/80'}`}>{feedback.message}</p>
      )}
    </div>
  )
}