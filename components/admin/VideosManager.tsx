"use client"
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { DbVideo } from '../../lib/videos-server'
import ConfirmDialog from './ConfirmDialog'

export default function VideosManager({ videos, canPublish, canDelete }: { videos: DbVideo[]; canPublish: boolean; canDelete: boolean }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<DbVideo | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  function videoId(url: string | null): string | null {
    if (!url) return null
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    return m ? m[1] : null
  }

  async function togglePublish(video: DbVideo) {
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const next = !video.published
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to update the video.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Video updated.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to update the video.' })
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
      const res = await fetch(`/api/admin/videos/${target.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to delete the video.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Video removed.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to delete the video.' })
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
        {videos.map((video) => {
          const ytId = videoId(video.public_url)
          return (
            <div key={video.id} className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
              <div className="relative aspect-video w-full bg-black/40">
                {ytId ? (
                  <Image
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={video.caption_en ?? 'Video thumbnail'}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-600">No thumbnail</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-medium text-white">{video.caption_en || 'Untitled'}</h3>
                {video.category && <p className="mt-1 text-xs text-gray-500">{video.category}</p>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${video.published ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
                    {video.published ? 'Published' : 'Hidden'}
                  </span>
                  <div className="flex gap-2">
                    {canPublish && (
                      <button type="button" onClick={() => void togglePublish(video)} disabled={busy} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10">
                        {video.published ? 'Hide' : 'Publish'}
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={() => setDeleting(video)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete "${deleting?.caption_en ?? 'this video'}"?`}
        description="This removes the video entry from the site. The YouTube video itself is not affected."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}