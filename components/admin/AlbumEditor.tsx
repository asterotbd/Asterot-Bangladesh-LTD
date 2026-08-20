"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DbAlbumPhoto } from '../../lib/albums-server'
import type { DbMedia } from '../../lib/media-server'
import ConfirmDialog from './ConfirmDialog'

type PickerMedia = DbMedia & { selected?: boolean }

export default function AlbumEditor({ albumId, coverMediaId, photos, canEdit }: { albumId: string; coverMediaId: string | null; photos: DbAlbumPhoto[]; canEdit: boolean }) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMedia, setPickerMedia] = useState<PickerMedia[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [urls, setUrls] = useState<Record<string, string | null>>({})
  const [removing, setRemoving] = useState<DbAlbumPhoto | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)

  async function loadPhotoUrls() {
    if (photos.length === 0) return
    const map: Record<string, string | null> = {}
    try {
      const res = await fetch('/api/admin/media?perPage=100&type=photo')
      const data = await res.json().catch(() => null)
      for (const m of (data?.data ?? []) as DbMedia[]) map[m.id] = m.public_url ?? null
    } catch {
      // ignore; photos will show placeholders
    }
    setUrls(map)
  }
  useEffect(() => {
    void loadPhotoUrls()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openPicker() {
    setPickerOpen(true)
    setPickerLoading(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/media?type=photo&perPage=100')
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.data) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to load media.' })
        return
      }
      const inAlbum = new Set(photos.map((p) => p.media_id))
      setPickerMedia((data.data as DbMedia[]).map((m) => ({ ...m, selected: inAlbum.has(m.id) })))
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to load media.' })
    } finally {
      setPickerLoading(false)
    }
  }

  async function addPhotos() {
    const selected = pickerMedia.filter((m) => m.selected && !photos.some((p) => p.media_id === m.id)).map((m) => m.id)
    if (selected.length === 0) {
      setPickerOpen(false)
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/albums/${albumId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaIds: selected })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to add photos.' })
        return
      }
      setPickerOpen(false)
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to add photos.' })
    } finally {
      setBusy(false)
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const index = photos.findIndex((p) => p.id === id)
    const target = index + dir
    if (index < 0 || target < 0 || target >= photos.length) return
    const reordered = photos.map((p) => p.id)
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await persistOrder(reordered)
  }

  async function persistOrder(orderedIds: string[]) {
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/albums/${albumId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to reorder photos.' })
        return
      }
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to reorder photos.' })
    } finally {
      setBusy(false)
    }
  }

  async function confirmRemove() {
    if (!removing || busy) return
    const target = removing
    setRemoving(null)
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/albums/${albumId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: target.id })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to remove the photo.' })
        return
      }
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to remove the photo.' })
    } finally {
      setBusy(false)
    }
  }

  async function setCover(mediaId: string) {
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/albums/${albumId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_media_id: mediaId })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Unable to set the cover.' })
        return
      }
      setFeedback({ kind: 'success', message: 'Cover photo updated.' })
      router.refresh()
    } catch {
      setFeedback({ kind: 'error', message: 'Unable to set the cover.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex justify-end">
        {canEdit && (
          <button type="button" onClick={openPicker} disabled={busy} className="btn btn-primary btn-sm">Add Photos</button>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">No photos in this album yet. Use “Add Photos” to pick from the media library.</p>
      ) : (
        <PhotoGrid photos={photos} urls={urls} coverMediaId={coverMediaId} canEdit={canEdit} onMove={move} onSetCover={setCover} onRemove={setRemoving} />
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !busy && setPickerOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Add photos" className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Add Photos</h3>
            <p className="mt-1 text-sm text-gray-400">Select photos from the media library to add to this album.</p>
            <div className="mt-4 flex-1 overflow-y-auto">
              {pickerLoading ? (
                <p className="py-10 text-center text-sm text-gray-500">Loading media…</p>
              ) : pickerMedia.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">No photos in the media library yet. Upload some from the Media page first.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {pickerMedia.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPickerMedia((prev) => prev.map((x) => x.id === m.id ? { ...x, selected: !x.selected } : x))}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${m.selected ? 'border-primary' : 'border-transparent'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.public_url ?? ''} alt={m.alt_en ?? ''} className="h-full w-full object-cover" />
                      {m.selected && <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-xs text-white">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setPickerOpen(false)} disabled={busy} className="btn btn-ghost">Cancel</button>
              <button type="button" onClick={addPhotos} disabled={busy || pickerLoading} className="btn btn-primary">
                {busy ? 'Adding…' : `Add Selected (${pickerMedia.filter((m) => m.selected && !photos.some((p) => p.media_id === m.id)).length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove photo from album?"
        description="The photo is removed from this album but stays in the media library."
        confirmLabel="Remove"
        danger
        busy={busy}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}

function PhotoGrid({ photos, urls, coverMediaId, canEdit, onMove, onSetCover, onRemove }: { photos: DbAlbumPhoto[]; urls: Record<string, string | null>; coverMediaId: string | null; canEdit: boolean; onMove: (id: string, dir: -1 | 1) => void; onSetCover: (mediaId: string) => void; onRemove: (photo: DbAlbumPhoto) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo, index) => {
        const url = urls[photo.media_id]
        const isCover = photo.media_id === coverMediaId
        return (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">{index + 1}</div>
            )}
            {isCover && (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">Cover</span>
            )}
            {canEdit && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/70 px-2 py-1.5">
                <button type="button" aria-label="Move photo left" disabled={index === 0} onClick={() => onMove(photo.id, -1)} className="rounded bg-white/10 px-2 py-0.5 text-xs text-white disabled:opacity-30">←</button>
                {!isCover && (
                  <button type="button" onClick={() => onSetCover(photo.media_id)} className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Cover</button>
                )}
                <button type="button" onClick={() => onRemove(photo)} className="rounded bg-red-500/30 px-2 py-0.5 text-xs text-red-200">Remove</button>
                <button type="button" aria-label="Move photo right" disabled={index === photos.length - 1} onClick={() => onMove(photo.id, 1)} className="rounded bg-white/10 px-2 py-0.5 text-xs text-white disabled:opacity-30">→</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}