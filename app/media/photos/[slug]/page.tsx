import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import PhotoAlbumPage from '../../../../components/PhotoAlbumPage'
import type { PhotoAlbum } from '../../../../lib/photoAlbums'
import { getAlbumBySlug, photoAlbums } from '../../../../lib/photoAlbums'
import { getAlbumBySlug as getDbAlbumBySlug, listAlbumPhotos } from '../../../../lib/albums-server'
import getAdminSupabase from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

type AlbumPageProps = {
  params: { slug: string }
}

// When the database owns a slug (a row exists with it), that slug must never
// resolve to the static fallback: an unpublished/draft album row must 404 even
// if a static album shares the slug. Only slugs the database does NOT own may
// fall back to the static album catalog.
type DbAlbumResult = { album: PhotoAlbum | null; owned: boolean }

const loadDbAlbum = cache(async (slug: string): Promise<DbAlbumResult> => {
  try {
    const dbAlbum = await getDbAlbumBySlug(slug)
    if (!dbAlbum) return { album: null, owned: false }
    if (!dbAlbum.published) return { album: null, owned: true }
    const photoRows = await listAlbumPhotos(dbAlbum.id)
    const mediaIds = [...new Set(photoRows.map((row) => row.media_id))]
    const urlById = new Map<string, string>()
    if (mediaIds.length > 0) {
      const { data: mediaRows, error: mediaError } = await getAdminSupabase()
        .from('media')
        .select('id, public_url')
        .in('id', mediaIds)
      if (mediaError) {
        console.error('Album detail media load error', mediaError.message)
      } else {
        for (const m of (mediaRows ?? []) as { id: string; public_url: string | null }[]) {
          if (m.public_url) urlById.set(m.id, m.public_url)
        }
      }
    }
    const photos = photoRows.map((row) => urlById.get(row.media_id)).filter((url): url is string => Boolean(url))
    return {
      album: {
        id: dbAlbum.id,
        title: dbAlbum.title_en || 'Album',
        slug: dbAlbum.slug || slug,
        description: dbAlbum.description_en || '',
        photos
      },
      owned: true
    }
  } catch (err) {
    console.error('Album detail load error', err)
    return { album: null, owned: false }
  }
})

function resolveAlbum(slug: string, dbResult: DbAlbumResult): PhotoAlbum | null {
  if (dbResult.owned) return dbResult.album
  return getAlbumBySlug(slug) ?? null
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const dbResult = await loadDbAlbum(params.slug)
  const album = resolveAlbum(params.slug, dbResult)
  if (!album) return { title: 'Album Not Found' }
  return {
    title: `${album.title} — Photos`,
    description: album.description,
    alternates: {
      canonical: `https://www.asterot.com/media/photos/${album.slug}`
    }
  }
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const dbResult = await loadDbAlbum(params.slug)
  const album = resolveAlbum(params.slug, dbResult)
  if (!album) notFound()

  return (
    <main className="bg-black text-white">
      <PhotoAlbumPage album={album} />
    </main>
  )
}