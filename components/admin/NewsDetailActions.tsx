"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import type { DbNews } from '../../lib/news-server'

export default function NewsDetailActions({ article, canDelete }: { article: DbNews; canDelete: boolean }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function togglePublish() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const nextPublished = !article.published
      const res = await fetch(`/api/admin/news/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          published: nextPublished,
          status: nextPublished ? 'published' : 'draft',
          published_at: nextPublished ? new Date().toISOString() : null
        })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to update the article.')
        return
      }
      router.refresh()
    } catch {
      setError('Unable to update the article.')
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
      const res = await fetch(`/api/admin/news/${article.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Unable to delete the article.')
        return
      }
      router.push('/admin/news')
      router.refresh()
    } catch {
      setError('Unable to delete the article.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {error && <span className="text-xs text-amber-200">{error}</span>}
      <button type="button" onClick={() => void togglePublish()} disabled={busy} className="btn btn-ghost btn-sm">
        {article.published ? 'Unpublish' : 'Publish'}
      </button>
      {canDelete && (
        <button type="button" onClick={() => setDeleting(true)} disabled={busy} className="btn btn-danger btn-sm">
          Delete
        </button>
      )}
      <ConfirmDialog
        open={deleting}
        title={`Delete "${article.title_en}"?`}
        description="This permanently removes the article. This action cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(false)}
      />
    </>
  )
}