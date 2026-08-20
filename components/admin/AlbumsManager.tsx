"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'

type AlbumRow = {
  id: string
  title_en: string | null
  slug: string | null
  published: boolean | null
  photoCount: number
  coverUrl: string | null
  created_at: string | null
}

export default function AlbumsManager({ albums, canEdit, canDelete }: { albums: AlbumRow[]; canEdit: boolean; canDelete: boolean }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<AlbumRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  async function confirmDelete() {
    if (!deleting || busy) return
    const target = deleting
    setDeleting(null)
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/albums/${target.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to delete.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Album deleted.' })
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((album) => (
          <div key={album.id} className="group block overflow-hidden rounded-2xl border border-white/10 bg-panel transition-colors hover:border-primary/40">
            <Link href={`/admin/media/albums/${album.id}`} className="block">
              <div className="aspect-video w-full bg-black/40">
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.coverUrl} alt={album.title_en ?? 'Album cover'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-gray-600">+</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-medium text-white">{album.title_en || 'Untitled'}</h3>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${album.published ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
                    {album.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{album.photoCount} photos · /{album.slug ?? '—'}</p>
              </div>
            </Link>
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                {canEdit && (
                  <Link href={`/admin/media/albums/${album.id}/edit`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                    Edit
                  </Link>
                )}
                {canDelete && (
                  <button type="button" onClick={() => setDeleting(album)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete "${deleting?.title_en ?? ''}"?`}
        description="This permanently removes the album and its photo associations. The media files themselves are kept."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}