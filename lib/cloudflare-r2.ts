import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. R2 media operations cannot proceed.`)
  }
  return value
}

const R2_ACCOUNT_ID = requireEnv('R2_ACCOUNT_ID')
const R2_S3_ENDPOINT = requireEnv('R2_S3_ENDPOINT')
const R2_BUCKET = requireEnv('R2_BUCKET')
const R2_ACCESS_KEY_ID = requireEnv('R2_ACCESS_KEY_ID')
const R2_SECRET_ACCESS_KEY = requireEnv('R2_SECRET_ACCESS_KEY')
const NEXT_PUBLIC_R2_PUBLIC_URL = requireEnv('NEXT_PUBLIC_R2_PUBLIC_URL')

const r2Client = new S3Client({
  endpoint: R2_S3_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export function getR2BucketName(): string {
  return R2_BUCKET
}

export function getR2PublicUrl(): string {
  return NEXT_PUBLIC_R2_PUBLIC_URL
}

export async function uploadToR2(
  objectKey: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: '3600',
  })
  try {
    await r2Client.send(command)
  } catch (err) {
    throw new Error(`Failed to upload to R2: ${(err as Error).message}`)
  }
}

export async function deleteFromR2(objectKey: string): Promise<{ ok: boolean; error?: string }> {
  const command = new DeleteObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
  })
  try {
    await r2Client.send(command)
    return { ok: true }
  } catch (err) {
    const message = (err as Error).message
    return { ok: false, error: message }
  }
}

export async function objectExistsInR2(objectKey: string): Promise<boolean> {
  const command = new HeadObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
  })
  try {
    await r2Client.send(command)
    return true
  } catch {
    return false
  }
}

export async function listR2Objects(prefix: string, maxKeys = 1000): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: getR2BucketName(),
    Prefix: prefix,
    MaxKeys: maxKeys,
  })
  try {
    const response = await r2Client.send(command)
    return (response.Contents ?? []).map((c) => c.Key!).filter((k): k is string => Boolean(k))
  } catch (err) {
    throw err
  }
}

export function getR2ObjectKey(type: string, originalName: string, ext: string): string {
  const typeDir = type === 'photo' ? 'photos' : type === 'video' ? 'videos' : 'media'
  const uuid = crypto.randomUUID()
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin'
  return `${typeDir}/${new Date().toISOString().slice(0, 7)}/${uuid}.${safeExt}`
}

export function getPublicUrlForObject(objectKey: string): string {
  const base = NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, '')
  return `${base}/${objectKey}`
}
