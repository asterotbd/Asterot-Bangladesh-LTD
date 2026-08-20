"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import type { DbEvent } from '../../lib/events-server'

export default function EventDetailActions({ event, canDelete }: { event: DbEvent; canDelete: boolean }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function togglePublish() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const nextPublished = !event.published
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: nextPublished, status: nextPublished ? 'published' : 'draft' })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to update the event.')
        return
      }
      router.refresh()
    } catch {
      setError('Unable to update the event.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (busy) return
    setDeleting(false)
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to delete the event.')
        return
      }
      router.push('/admin/events')
      router.refresh()
    } catch {
      setError('Unable to delete the event.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {error && <span className="text-xs text-amber-200">{error}</span>}
      <button type="button" onClick={() => void togglePublish()} disabled={busy} className="btn btn-ghost btn-sm">
        {event.published ? 'Unpublish' : 'Publish'}
      </button>
      {canDelete && (
        <button type="button" onClick={() => setDeleting(true)} disabled={busy} className="btn btn-danger btn-sm">
          Delete
        </button>
      )}
      <ConfirmDialog
        open={deleting}
        title={`Delete "${event.title_en}"?`}
        description="This permanently removes the event and its audit trail association. This action cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(false)}
      />
    </>
  )
}