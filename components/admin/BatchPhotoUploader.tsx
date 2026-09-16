"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { logError } from '../../lib/api-utils'

type AlbumRow = {
  id: string
  title_en: string | null
}

type UploadStatus = 'waiting' | 'uploading' | 'processed' | 'failed'

interface FileState {
  status: UploadStatus
  error?: string
  preview: string | null
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp']

function isImageFile(name: string): boolean {
  return IMAGE_EXTENSIONS.includes(name.split('.').pop()?.toLowerCase() || '')
}

// Downscales a selected file to a data URL so the grid can show a thumbnail
// without holding full-resolution bitmaps in memory.
function generatePreview(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = document.createElement('img')
      img.onload = () => {
        const maxWidth = 200
        const maxHeight = 200
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

export default function BatchPhotoUploader() {
  const router = useRouter()

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  // Keyed by file name, which is also how /api/admin/media-batch reports
  // per-file results back.
  const [fileStates, setFileStates] = useState<Record<string, FileState>>({})
  const [albumId, setAlbumId] = useState<string>('')
  const [albums, setAlbums] = useState<AlbumRow[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/albums', { credentials: 'same-origin' })
        if (!res.ok) throw new Error(`Albums request failed: ${res.status}`)
        const body = await res.json()
        const items = (Array.isArray(body?.data) ? body.data : []) as AlbumRow[]
        if (cancelled) return
        setAlbums(items)
        setAlbumId((current) => current || items[0]?.id || '')
      } catch (err) {
        logError('batch-uploader.load-albums', err)
        if (!cancelled) setFeedback({ kind: 'error', message: 'Unable to load albums.' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const picked = Array.from(files)
    const validFiles = picked.filter((file) => isImageFile(file.name))

    if (validFiles.length === 0) {
      setFeedback({ kind: 'error', message: 'Unsupported file type. Only JPG, PNG, WEBP are supported.' })
      return
    }

    setFeedback(null)

    let added: File[] = []
    setSelectedFiles((current) => {
      const existing = new Set(current.map((f) => f.name))
      added = validFiles.filter((f) => !existing.has(f.name))
      return added.length > 0 ? [...current, ...added] : current
    })

    setFileStates((current) => {
      const next = { ...current }
      for (const file of added) {
        next[file.name] = { status: 'waiting', preview: null }
      }
      return next
    })

    for (const file of added) {
      const preview = await generatePreview(file)
      setFileStates((current) => {
        const state = current[file.name]
        if (!state) return current
        return { ...current, [file.name]: { ...state, preview } }
      })
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer?.files
    if (files) void handleFileSelect(files)
  }

  const removeFile = (fileName: string) => {
    setSelectedFiles((current) => current.filter((f) => f.name !== fileName))
    setFileStates((current) => {
      const next = { ...current }
      delete next[fileName]
      return next
    })
    setFeedback(null)
  }

  const handleUpload = async () => {
    if (isUploading) return
    if (!albumId) {
      setFeedback({ kind: 'error', message: 'Please select an album.' })
      return
    }
    if (selectedFiles.length === 0) {
      setFeedback({ kind: 'error', message: 'No files to upload.' })
      return
    }

    setIsUploading(true)
    setFeedback(null)
    setFileStates((current) => {
      const next = { ...current }
      for (const file of selectedFiles) {
        next[file.name] = { ...(next[file.name] ?? { preview: null }), status: 'uploading', error: undefined }
      }
      return next
    })

    const fd = new FormData()
    fd.append('albumId', albumId)
    for (const file of selectedFiles) {
      fd.append('files', file)
    }

    try {
      const res = await fetch('/api/admin/media-batch', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin'
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setFeedback({ kind: 'error', message: data?.error || 'Upload failed.' })
        setFileStates((current) => {
          const next = { ...current }
          for (const file of selectedFiles) {
            next[file.name] = { ...(next[file.name] ?? { preview: null }), status: 'failed' }
          }
          return next
        })
        return
      }

      const results = Array.isArray(data?.results)
        ? (data.results as { name: string; ok: boolean; error?: string }[])
        : []

      setFileStates((current) => {
        const next = { ...current }
        for (const result of results) {
          const previous = next[result.name] ?? { preview: null }
          next[result.name] = result.ok
            ? { ...previous, status: 'processed', error: undefined }
            : { ...previous, status: 'failed', error: result.error }
        }
        return next
      })

      const successful = Number(data?.successful ?? 0)
      const failed = results.filter((r) => !r.ok).length
      if (successful > 0) {
        setSelectedFiles((current) => {
          const uploaded = new Set(results.filter((r) => r.ok).map((r) => r.name))
          return current.filter((f) => !uploaded.has(f.name))
        })
        setFeedback({
          kind: failed > 0 ? 'error' : 'success',
          message: failed > 0
            ? `${successful} uploaded, ${failed} failed.`
            : `${successful} photo${successful === 1 ? '' : 's'} uploaded successfully.`
        })
        router.refresh()
      } else {
        setFeedback({ kind: 'error', message: 'No photos were uploaded.' })
      }
    } catch (err) {
      logError('batch-uploader.upload', err)
      setFeedback({ kind: 'error', message: 'Upload failed. Please retry.' })
      setFileStates((current) => {
        const next = { ...current }
        for (const file of selectedFiles) {
          next[file.name] = { ...(next[file.name] ?? { preview: null }), status: 'failed' }
        }
        return next
      })
    } finally {
      setIsUploading(false)
    }
  }

  const retryFile = (fileName: string) => {
    setFileStates((current) => {
      const state = current[fileName]
      if (!state) return current
      return { ...current, [fileName]: { ...state, status: 'waiting', error: undefined } }
    })
  }

  const dropZoneClass = [
    'transition-all duration-200 rounded-2xl border cursor-pointer',
    isDragging ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-black/40'
  ].join(' ')

  const dropZoneText = isDragging ? 'Release to upload' : 'Drag & drop photos here'
  const fileCount = selectedFiles.length
  const failedFiles = selectedFiles.filter((f) => fileStates[f.name]?.status === 'failed')

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="batch-album">
          Select Album
        </label>
        <select
          id="batch-album"
          value={albumId}
          onChange={(e) => setAlbumId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
        >
          <option value="">-- Select Album --</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title_en || 'Untitled'}
            </option>
          ))}
        </select>
        {albums.length === 0 && (
          <p className="mt-2 text-xs text-gray-500">No albums found. Create an album first.</p>
        )}
      </div>

      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          onClick={() => document.getElementById('file-picker')?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              document.getElementById('file-picker')?.click()
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${dropZoneClass} h-64 w-full flex flex-col items-center justify-center gap-3`}
        >
          <svg
            className={`w-12 h-12 ${isDragging ? 'text-primary' : 'text-gray-400'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <path d="M12 3v12m0-12l-4 4m4-4l4 4" />
          </svg>

          <p className="text-sm text-gray-400">{dropZoneText}</p>
          <p className="text-xs text-gray-500">or</p>
          <input
            id="file-picker"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFileSelect(e.target.files)
              e.target.value = ''
            }}
          />
          <span className="text-xs text-gray-400">Browse files</span>
        </div>

        {fileCount > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {selectedFiles.map((file) => {
              const state = fileStates[file.name]
              const isFailed = state?.status === 'failed'

              return (
                <div
                  key={file.name}
                  className={`relative rounded-xl border ${isFailed ? 'border-red-500/30' : 'border-white/10'} bg-panel overflow-hidden transition-colors`}
                >
                  {state?.preview ? (
                    <Image
                      src={state.preview}
                      alt={file.name}
                      width={200}
                      height={150}
                      className="h-48 w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div
                      className={`h-48 w-full flex items-center justify-center ${isFailed ? 'bg-red-500/10' : 'bg-black/40'}`}
                    >
                      <svg
                        className="w-8 h-8 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}

                  <div className="p-2 text-center">
                    <p className="truncate text-xs text-gray-300">{file.name}</p>
                    {file.size > 0 && (
                      <p className="text-xs text-gray-400">{Math.round(file.size / 1024)} KB</p>
                    )}
                    {state?.status === 'uploading' && (
                      <p className="mt-1 text-xs text-gray-400">Uploading…</p>
                    )}
                    {isFailed && (
                      <p className="mt-1 text-xs text-red-400">{state?.error || 'Upload failed'}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    className="absolute top-1 right-1 rounded-lg border border-red-500/20 p-1 text-red-300 hover:bg-red-500/15 transition-colors"
                    title="Remove"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}

            <div className="col-span-full">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full mt-3 rounded-xl border border-primary bg-primary text-white px-4 py-2.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? `Uploading ${fileCount} photos…` : `Upload ${fileCount} Photo${fileCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
          {feedback.message}
        </div>
      )}

      {failedFiles.length > 0 && !isUploading && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm">
          <p className="text-red-300 mb-1">
            Failed: {failedFiles.length} photo{failedFiles.length === 1 ? '' : 's'}
          </p>
          {failedFiles.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-2 text-xs text-gray-300">
              <span className="truncate">
                {f.name}: {fileStates[f.name]?.error || 'Unknown error'}
              </span>
              <button
                type="button"
                onClick={() => retryFile(f.name)}
                className="shrink-0 rounded-lg border border-primary bg-primary/5 text-primary px-2 py-1"
                title="Retry"
              >
                Retry
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
