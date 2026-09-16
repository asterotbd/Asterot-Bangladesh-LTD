// Upload rules shared by the browser uploader and the server routes, so a file
// the picker accepts is never rejected by the API for a different reason.
// This module is imported by client components and must stay free of any
// server-only dependency.

// Uploads go straight to R2, so no function body limit applies. This is only a
// safety ceiling against a wrong or corrupt file: well above any camera or
// phone photo (the site's own originals reach 24 MB), far below R2's 5 GB
// single-object limit.
export const MAX_IMAGE_BYTES = 100 * 1024 * 1024
export const MAX_FILES_PER_UPLOAD = 50

// Raster formats only. SVG is deliberately excluded: it can embed script that
// browsers execute when it is served as image/svg+xml.
export const IMAGE_MIME_BY_EXT: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp'
}

// MIME types let iOS convert HEIC photos to JPEG in its picker; extensions
// cover desktop file dialogs that filter by name.
export const IMAGE_ACCEPT = [
  ...new Set(Object.values(IMAGE_MIME_BY_EXT)),
  ...Object.keys(IMAGE_MIME_BY_EXT).map((ext) => `.${ext}`)
].join(',')

export function imageExtension(name: string): string | null {
  const ext = (name.split('.').pop() || '').toLowerCase()
  return ext in IMAGE_MIME_BY_EXT ? ext : null
}

/** Returns a user-facing reason the file cannot be uploaded, or null if it can. */
export function describeImageProblem(file: { name: string; size: number }): string | null {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext === 'heic' || ext === 'heif') {
    return 'HEIC photos are not supported. Export as JPEG, or upload from the iPhone Photos picker, which converts automatically.'
  }
  if (!imageExtension(file.name)) return 'Unsupported file type. Use JPG, PNG, GIF, WebP, AVIF, or BMP.'
  if (file.size <= 0) return 'The file is empty.'
  if (file.size > MAX_IMAGE_BYTES) return `Larger than the ${MAX_IMAGE_BYTES / 1024 / 1024} MB limit.`
  return null
}
