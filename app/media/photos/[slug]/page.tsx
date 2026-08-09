import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PhotoAlbumPage from '../../../../components/PhotoAlbumPage'
import { getAlbumBySlug, photoAlbums } from '../../../../lib/photoAlbums'

type AlbumPageProps = {
  params: { slug: string }
}

export function generateStaticParams() {
  return photoAlbums.map(album => ({ slug: album.slug }))
}

export function generateMetadata({ params }: AlbumPageProps): Metadata {
  const album = getAlbumBySlug(params.slug)
  if (!album) return { title: 'Album Not Found' }
  return {
    title: `${album.title} — Photos | Asterot`,
    description: album.description,
    alternates: {
      canonical: `https://www.asterot.com/media/photos/${album.slug}`
    }
  }
}

export default function AlbumPage({ params }: AlbumPageProps) {
  const album = getAlbumBySlug(params.slug)
  if (!album) notFound()

  return (
    <main className="bg-black text-white">
      <PhotoAlbumPage album={album} />
    </main>
  )
}
