"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'
import { logError } from '../../lib/api-utils'
import { listAlbums } from '../../lib/albums-server'
import { getCurrentUser } from '../../lib/auth'
import PageHeader from '../../components/admin/PageHeader'

type ImagePreview = {
  uid: string
  file: File
  preview: string | null
  name: string
  size: number
  width: number | null
  height: number | null
}

type AlbumRow = {
  id: string
  title_en: string | null
}

interface UploadState {
  uid: string
  status: 'waiting' | 'uploading' | 'processed' | 'failed'
  progress: number
  error?: string
  preview: string | null
}

export default async function BatchPhotoUploader() {
  const router = useRouter()
  const [searchParams] = useSearchParams()

  const user = await getCurrentUser()
  if (!user) router.replace('/admin/login')

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadState>>({})
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [albums, setAlbums] = useState<AlbumRow[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Load albums on mount
  useEffect(() => {
    ;(async () => {
      try {
        const result = await listAlbums({ perPage: 100 })
        setAlbums(result.items)
        if (!albumId && result.items.length > 0) setAlbumId(result.items[0].id)
      } catch (err) {
        logError('batch-uploader.load-albums', err)
      }
    })()
  }, [])

  // Keep albumId in sync with first album selection
  useEffect(() => {
    if (albums.length > 0 && !albumId) {
      setAlbumId(albums[0].id)
    }
  }, [albums, albumId])

  // Generate unique UID for each file
  const generateUid = (file: File): string => {
    return file.name + Date.now()
  }

  // Read file as data URL for preview
  const generatePreview = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxWidth = 200
          const maxHeight = 200
          let { width, height } = img

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
          }
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = () => resolve(null)
        img.src = e.target?.result as string
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  // Handle file selection (click or drag)
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp'].includes(ext)) {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0 && files.length > 0) {
      setFeedback({ kind: 'error', message: 'Unsupported file type. Only JPG, PNG, WEBP are supported.' })
      return
    }

    const newSet = [...selectedFiles, ...validFiles]
    setSelectedFiles(newSet)

    // Initialize upload status for new files
    const newStatuses = { ...uploadStatuses }
    for (const file of validFiles) {
      const uid = generateUid(file)
      if (!newStatuses[uid]) {
newStatuses[uid] = { uid, status: 'waiting', progress: 0, preview: null }
      }
    }
    setUploadStatuses(newStatuses)

    setFeedback(null)
  }

  // Handle drag enter/over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
    setIsDragging(true)
  }

  // Handle drag leave
  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer?.files
    if (files) handleFileSelect(files)
  }

  // Remove a file from the upload queue
  const removeFile = (fileName: string) => {
    const newFiles = selectedFiles.filter((f) => f.name !== fileName)
    setSelectedFiles(newFiles)

    const newStatuses = { ...uploadStatuses }
    const uid = fileName + Date.now()
    delete newStatuses[uid]
    setUploadStatuses(newStatuses)

    setFeedback(null)
  }

  // Upload all selected files
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

    // Prepare FormData
    const fd = new FormData()
    fd.append('albumId', albumId)
    for (const file of selectedFiles) {
      fd.append('files', file)
    }

    try {
      const res = await fetch('/api/admin/media-batch', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json()

      if (!res.ok) {
        setFeedback({ kind: 'error', message: data.error || 'Upload failed.' })
        setIsUploading(false)
        return
      }

      // Update statuses based on results
      if (data.results && Array.isArray(data.results)) {
        const newStatuses = { ...uploadStatuses }
        for (const result of data.results) {
          if (result.ok) {
            newStatuses[result.name] = { uid: result.name, status: 'processed', progress: 100, preview: null }
          } else {
            newStatuses[result.name] = {
              uid: result.name,
              status: 'failed',
              progress: 0,
              error: result.error,
              preview: null,
            }
          }
        }
        setUploadStatuses(newStatuses)
      }

      if (data.successful > 0) {
        setFeedback({ kind: 'success', message: `${data.successful} photos uploaded successfully.` })
      }

      // Refresh the page to show new photos
      router.refresh()
    } catch (err) {
      logError('batch-uploader.upload', err)
      setFeedback({ kind: 'error', message: 'Upload failed. Please retry.' })
    } finally {
      setIsUploading(false)
    }
  }

  // Retry a failed file
  const retryFile = (fileName: string) => {
    const file = selectedFiles.find((f) => f.name === fileName)
    if (!file) return

    const uid = file.name + Date.now()
    const newStatuses = { ...uploadStatuses }
    newStatuses[uid] = { uid, status: 'waiting', progress: 0, preview: null }
    setUploadStatuses(newStatuses)
  }

  // Fetch albums if not loaded (refresh if album was deleted etc.)
  useEffect(() => {
    ;(async () => {
      try {
        const result = await listAlbums({ perPage: 100 })
        setAlbums(result.items)
        if (!albumId && result.items.length > 0) setAlbumId(result.items[0].id)
      } catch (err) {
        logError('batch-uploader.load-albums', err)
      }
    })()
  }, [albumId])

  // Compute classes for drag-and-drop zone
  const dropZoneClass = `
    transition-all duration-200 
    rounded-2xl border 
    border-white/10 bg-black/40 
    ${isDragging ? 'border-primary/30 bg-primary/5' : ''}
    cursor-pointer
  `.trim()

  const dropZoneText = isDragging
    ? 'Release to upload'
    : 'Drag & drop photos here'

  // Count selected files
  const fileCount = selectedFiles.length

  // Get failed files
  const failedFiles = selectedFiles.filter((f) => {
    const uid = f.name + Date.now()
    const status = uploadStatuses[uid]?.status
    return status === 'failed'
  })

  // Get waiting files
  const waitingFiles = selectedFiles.filter((f) => {
    const uid = f.name + Date.now()
    const status = uploadStatuses[uid]?.status
    return status === 'waiting'
  })

  if (!user) {
    return null // Already redirected, but keep TypeScript happy
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Add Photos"
          description="Upload photos to the Asterot media library."
          actions={null}
        />
      </div>

      {/* Album selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Select Album
        </label>
        <select
          value={albumId ?? ''}
          onChange={(e) => setAlbumId(e.target.value || null)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
        >
          <option value="">-- Select Album --</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title_en || 'Untitled'}
            </option>
          ))}
          {albums.length === 0 && (
            <option value="" disabled>
              No albums found
            </option>
          )}
        </select>
        <p className="mt-2 text-xs text-gray-500">
          {'+'}{' '}
          Create new album{' '}
          {user?.user_metadata?.role === 'super_admin' ? (
            '(admin permission required)'
          ) : (
            '(not available)'
          )}
        </p>
      </div>

      {/* Upload area */}
      <div className="relative">
        <div
          onClick={() => document.getElementById('file-picker')?.click()}
          className={`${dropZoneClass} h-64 w-full flex flex-col items-center justify-center gap-3 border`}
        >
          <svg
            className="w-12 h-12 text-gray-400 drop:{isDragging ? 'primary' : 'default'}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <path d="M17 7H7m5 4h3a2 2 0 012 2v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h11" />
          </svg>

          <p className="text-sm text-gray-400">{dropZoneText}</p>
          <p className="text-xs text-gray-500">or</p>
          <input
            id="file-picker"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <span className="text-xs text-gray-400 cursor-pointer">Browse files</span>
        </div>

        {/* Preview grid */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {selectedFiles.map((file, fileIndex) => {
              const uid = file.name + Date.now()
              const state = uploadStatuses[uid]
              const isFailed = state?.status === 'failed'

              // Generate preview
              const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp'].includes(
                file.name.split('.').pop()?.toLowerCase() || ''
              )

              return (
                <div
                  key={fileIndex}
                  className={`relative rounded-xl border ${isFailed ? 'border-red-500/30' : 'border-white/10'} bg-panel overflow-hidden transition-colors`}
                >
                  {isImage && state?.status !== 'waiting' && state?.preview
                    ? (
                      <Image
                        src={state.preview}
                        alt={file.name}
                        width={200}
                        height={150}
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={`h-48 w-full flex items-center justify-center ${isFailed ? 'bg-red-500/10' : 'bg-black/40'}`}
                      >
                        {isImage ? (
                          <svg
                            className="w-8 h-8 text-gray-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          </svg>
                        ) : (
                          <svg
                            className="w-8 h-8 text-gray-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          </svg>
                        )}
                      </div>
                    )}

                  <div className="p-2 text-center">
                    <p className="truncate text-xs text-gray-300 line-clamp-1">{file.name}</p>
                    {file.size > 0 && (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    )}
                    {isFailed && (
                      <p className="text-xs text-red-400 mt-1">{state?.error || 'Upload failed'}</p>
                    )}
                  </div>

                  <button
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

            {selectedFiles.length > 0 && (
              <div className="col-span-full">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full mt-3 rounded-xl border border-primary bg-primary text-white px-4 py-2.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? `Uploading ${fileCount} photos…` : `Upload ${fileCount} Photos`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state - no files selected */}
        {selectedFiles.length === 0 && (
          <div className="mt-4 h-64 w-full flex items-center justify-center border border-white/10 bg-black/40 rounded-2xl">
            <svg
              className="w-12 h-12 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <path d="M17 7H7m5 4h3a2 2 0 012 2v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h11" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">Drag & drop photos here</p>
            <p className="text-xs text-gray-500">or click Browse files</p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
          {feedback.message}
        </div>
      )}

      {/* Failed files summary */}
      {failedFiles.length > 0 && (
        <div className="mt-3 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm">
          <p className="text-red-300 mb-1">Failed: {failedFiles.length} photo{"s".repeat(Number(failedFiles.length !== 1))}</p>
          {failedFiles.map((f, i) => {
            const uid = f.name + Date.now()
            const state = uploadStatuses[uid]
            return (
              <div key={i} className="text-gray-300 text-xs line-clamp-1">
                {f.name}: {state?.error || 'Unknown error'}
              </div>
            )
          })}
        </div>
      )}

      {/* Retry section for failed files */}
      {failedFiles.length > 0 && !isUploading && (
        <div className="mt-3 flex gap-2">
          {failedFiles.map((f) => {
            const uid = f.name + Date.now()
            const state = uploadStatuses[uid]
            return (
              <button
                key={f.name}
                onClick={() => retryFile(f.name)}
                className="rounded-xl border border-primary bg-primary/5 text-primary px-3 py-1.5 text-sm transition-colors"
                disabled={isUploading}
                title="Retry"
              >
                Retry
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}