"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { logError } from '../../lib/api-utils'
import PageHeader from '../../components/admin/PageHeader'

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
  name: string
  size: number
  file: File
}

export default function BatchPhotoUploader() {
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({})
  const [albumId, setAlbumId] = useState<string | null>(null)
  const [albums, setAlbums] = useState<AlbumRow[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Map from file object to stable UID
  const fileUidMap = useRef<Map<File, string>>(new Map())
  const uidCounterRef = useRef(0)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/albums?perPage=100')
        const data = await res.json().catch(() => null)
        if (data?.items) {
          setAlbums(data.items)
        }
      } catch (err) {
        logError('batch-uploader.load-albums', err)
      }
    })()
  }, [])

  const getUid = useCallback((file: File): string => {
    if (!fileUidMap.current.has(file)) {
      const uid = `file-${Date.now()}-${uidCounterRef.current++}-${Math.random().toString(36).slice(2, 8)}`
      fileUidMap.current.set(file, uid)
    }
    return fileUidMap.current.get(file)!
  }, [])

  const generatePreview = useCallback((file: File): Promise<string | null> => {
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
  }, [])

  const validateFile = useCallback((file: File): { ok: boolean; error?: string } => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const validExts = ['jpg', 'jpeg', 'png', 'webp']
    if (!validExts.includes(ext)) {
      return { ok: false, error: 'Unsupported file type. Only JPG, PNG, and WebP are supported.' }
    }
    if (file.size > 15 * 1024 * 1024) {
      return { ok: false, error: `${file.name} exceeds the 15 MB limit.` }
    }
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: `${file.name} is not an image file.` }
    }
    return { ok: true }
  }, [])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles: File[] = []
    const errors: string[] = []
    for (const file of files) {
      const validation = validateFile(file)
      if (validation.ok) {
        validFiles.push(file)
      } else {
        errors.push(validation.error || 'Invalid file')
      }
    }

    if (errors.length > 0) {
      setFeedback({ kind: 'error', message: errors.join(' ') })
    }

    if (validFiles.length === 0) return

    setSelectedFiles((prev) => [...prev, ...validFiles])

    setUploadStates((prev) => {
      const next = { ...prev }
      for (const file of validFiles) {
        const uid = getUid(file)
        if (!next[uid]) {
          next[uid] = { uid, status: 'waiting', progress: 0, preview: null, name: file.name, size: file.size, file }
        }
      }
      return next
    })

    setFeedback(null)

    for (const file of validFiles) {
      const preview = await generatePreview(file)
      const uid = getUid(file)
      setUploadStates((prev) => ({
        ...prev,
        [uid]: { ...prev[uid], preview }
      }))
    }
  }, [validateFile, getUid, generatePreview])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer?.files
    if (files) handleFileSelect(files)
  }, [handleFileSelect])

  const removeFile = useCallback((uid: string) => {
    // Find the file for this UID
    let fileToRemove: File | null = null
    for (const [file, fuid] of fileUidMap.current.entries()) {
      if (fuid === uid) {
        fileToRemove = file
        break
      }
    }
    if (fileToRemove) {
      fileUidMap.current.delete(fileToRemove)
      setSelectedFiles((prev) => prev.filter((f) => f !== fileToRemove))
    }
    setUploadStates((prev) => {
      const next = { ...prev }
      delete next[uid]
      return next
    })
    setFeedback(null)
  }, [])

  const retryFile = useCallback((uid: string) => {
    setUploadStates((prev) => ({
      ...prev,
      [uid]: { ...prev[uid], status: 'waiting', progress: 0, error: undefined }
    }))
  }, [])

  const handleUpload = useCallback(async () => {
    if (isUploading) return
    if (!albumId) {
      setFeedback({ kind: 'error', message: 'Please select an album.' })
      return
    }
    const waitingFiles = Object.values(uploadStates).filter((s) => s.status === 'waiting')
    const retryFiles = Object.values(uploadStates).filter((s) => s.status === 'failed')
    const filesToUpload = [...waitingFiles, ...retryFiles]
    if (filesToUpload.length === 0) {
      setFeedback({ kind: 'error', message: 'No files to upload.' })
      return
    }

    setIsUploading(true)
    setFeedback(null)

    setUploadStates((prev) => {
      const next = { ...prev }
      for (const fs of filesToUpload) {
        next[fs.uid] = { ...fs, status: 'uploading', progress: 0 }
      }
      return next
    })

    const formData = new FormData()
    formData.append('albumId', albumId)
    for (const fs of filesToUpload) {
      formData.append('files', fs.file)
    }

    try {
      const res = await fetch('/api/admin/media-batch', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data) {
        setFeedback({ kind: 'error', message: data?.error || 'Upload failed.' })
        setIsUploading(false)
        return
      }

      if (data.results && Array.isArray(data.results)) {
        setUploadStates((prev) => {
          const next = { ...prev }
          for (const result of data.results) {
            const uid = Object.keys(next).find((key) => {
              const state = prev[key]
              return state?.name === result.name
            })
            if (uid) {
              next[uid] = {
                ...next[uid],
                status: result.ok ? 'processed' : 'failed',
                progress: result.ok ? 100 : 0,
                error: result.error,
              }
            }
          }
          return next
        })
      }

      if (data.successful > 0) {
        setFeedback({ kind: 'success', message: `${data.successful} photo(s) uploaded successfully.` })
      }
      if (data.failed > 0) {
        setFeedback((prev) => prev ? { kind: 'error', message: `${data.failed} photo(s) failed.` } : prev)
      }

      setTimeout(() => {
        setSelectedFiles((prev) => prev.filter((f) => {
          const uid = getUid(f)
          const state = uploadStates[uid]
          return state?.status !== 'processed'
        }))
      }, 5000)

      router.refresh()
    } catch (err) {
      logError('batch-uploader.upload', err)
      setFeedback({ kind: 'error', message: 'Upload failed. Please retry.' })
    } finally {
      setIsUploading(false)
    }
  }, [isUploading, albumId, uploadStates, router, getUid])

  const fileCount = selectedFiles.length
  const waitingCount = Object.values(uploadStates).filter((s) => s.status === 'waiting').length
  const failedCount = Object.values(uploadStates).filter((s) => s.status === 'failed').length
  const processedCount = Object.values(uploadStates).filter((s) => s.status === 'processed').length
  const uploadingCount = Object.values(uploadStates).filter((s) => s.status === 'uploading').length

  const filesToUpload = waitingCount + failedCount

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
      </div>

      {/* Upload area */}
      <div className="relative">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${dropZoneClass} h-64 w-full flex flex-col items-center justify-center gap-3 border`}
        >
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

          <p className="text-sm text-gray-400">{dropZoneText}</p>
          <p className="text-xs text-gray-500">or</p>
          <input
            ref={fileInputRef}
            id="file-picker"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <span className="text-xs text-gray-400 cursor-pointer">Browse Files</span>
        </div>

        {/* Preview grid */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {selectedFiles.map((file, fileIndex) => {
              const uid = getUid(file)
              const state = uploadStates[uid]
              const isFailed = state?.status === 'failed'
              const isProcessing = state?.status === 'uploading'

              return (
                <div
                  key={fileIndex}
                  className={`relative rounded-xl border ${isFailed ? 'border-red-500/30' : 'border-white/10'} bg-panel overflow-hidden transition-colors`}
                >
                  {state?.preview ? (
                    <Image
                      src={state.preview}
                      alt={file.name}
                      width={200}
                      height={150}
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`h-48 w-full flex items-center justify-center ${isFailed ? 'bg-red-500/10' : 'bg-black/40'}`}>
                      <svg
                        className="w-8 h-8 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h11" />
                      </svg>
                    </div>
                  )}

                  <div className="p-2 text-center">
                    <p className="truncate text-xs text-gray-300 line-clamp-1">{file.name}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {Math.round(file.size / 1024)} KB
                    </p>
                    {isProcessing && (
                      <div className="mt-1">
                        <div className="w-full bg-black/40 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${state.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{state.progress}%</p>
                      </div>
                    )}
                    {isFailed && (
                      <p className="text-xs text-red-400 mt-1">{state?.error || 'Upload failed'}</p>
                    )}
                  </div>

                  <button
                    onClick={() => removeFile(uid)}
                    className="absolute top-1 right-1 rounded-lg border border-red-500/20 p-1 text-red-300 hover:bg-red-500/15 transition-colors"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>

                  {isFailed && (
                    <button
                      onClick={() => retryFile(uid)}
                      className="absolute bottom-1 left-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary transition-colors"
                      title="Retry"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )
            })}

            {selectedFiles.length > 0 && (
              <div className="col-span-full">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || uploadingCount > 0}
                  className="w-full mt-3 rounded-xl border border-primary bg-primary text-white px-4 py-2.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading
                    ? `Uploading ${uploadingCount} photo(s)…`
                    : `Upload ${filesToUpload} Photo${filesToUpload !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
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
      {failedCount > 0 && (
        <div className="mt-3 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm">
          <p className="text-red-300 mb-1">Failed: {failedCount} photo(s)</p>
          {Object.values(uploadStates)
            .filter((s) => s.status === 'failed')
            .map((state, i) => (
              <div key={i} className="text-gray-300 text-xs line-clamp-1">
                {state.name}: {state.error || 'Unknown error'}
              </div>
            ))}
        </div>
      )}

      {/* Retry section */}
      {failedCount > 0 && !isUploading && (
        <div className="mt-3 flex gap-2">
          {Object.values(uploadStates)
            .filter((s) => s.status === 'failed')
            .map((state) => (
              <button
                key={state.uid}
                onClick={() => retryFile(state.uid)}
                className="rounded-xl border border-primary bg-primary/5 text-primary px-3 py-1.5 text-sm transition-colors"
                disabled={isUploading}
              >
                Retry: {state.name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
