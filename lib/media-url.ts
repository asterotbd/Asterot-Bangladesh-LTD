import { getR2PublicUrl, getPublicUrlForObject } from './cloudflare-r2'

export function getMediaPublicUrl(objectKey: string | null): string | null {
  if (!objectKey) return null
  return getPublicUrlForObject(objectKey)
}

export function getMediaStoragePath(type: string, originalName: string, ext: string): string {
  const typeDir = type === 'photo' ? 'photos' : type === 'video' ? 'videos' : 'media'
  const uuid = crypto.randomUUID()
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin'
  return `${typeDir}/${new Date().toISOString().slice(0, 7)}/${uuid}.${safeExt}`
}
