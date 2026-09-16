"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DeviceImageUploader, { type UploadSummary } from './DeviceImageUploader'

type AlbumRow = { id: string; title_en: string | null }

// Bulk upload from the device into the media library, optionally straight into
// an album. The upload itself is handled by DeviceImageUploader, which sends
// files directly to R2.
export default function BatchPhotoUploader() {
  const router = useRouter()
  const [albums, setAlbums] = useState<AlbumRow[]>([])
  const [albumId, setAlbumId] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // The albums endpoint pages at 24; walk every page so no album is
        // missing from the list.
        const all: AlbumRow[] = []
        for (let page = 1, totalPages = 1; page <= totalPages; page++) {
          const res = await fetch(`/api/admin/albums?page=${page}`)
          if (!res.ok) throw new Error(`Albums request failed: ${res.status}`)
          const body = await res.json()
          all.push(...((Array.isArray(body?.data) ? body.data : []) as AlbumRow[]))
          totalPages = Number(body?.totalPages) || 1
        }
        if (!cancelled) setAlbums(all)
      } catch (err) {
        console.error('batch-uploader.load-albums', err)
        if (!cancelled) setLoadError('Unable to load albums. Photos can still be uploaded to the media library.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function handleUploaded({ mediaIds }: UploadSummary) {
    if (mediaIds.length > 0) router.refresh()
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-300" htmlFor="batch-album">Add to album</label>
        <select
          id="batch-album"
          value={albumId}
          onChange={(e) => setAlbumId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
        >
          <option value="">None, media library only</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title_en || 'Untitled'}
            </option>
          ))}
        </select>
        {loadError && <p className="mt-2 text-xs text-amber-200/80">{loadError}</p>}
      </div>

      <DeviceImageUploader albumId={albumId || null} onUploaded={handleUploaded} />
    </div>
  )
}
