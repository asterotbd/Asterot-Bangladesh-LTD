import PhotoAlbumCard from './PhotoAlbumCard'
import { photoAlbums, type PhotoAlbum } from '../lib/photoAlbums'

type DbAlbumSummary = {
  id: string
  title_en: string | null
  slug: string | null
  description_en: string | null
  photos: { id: string; publicUrl: string }[]
}

export default function PhotoAlbumsGrid({ albums }: { albums?: DbAlbumSummary[] }) {
  const items: PhotoAlbum[] = (albums && albums.length > 0
    ? albums.map((a) => ({
        id: a.id,
        title: a.title_en || 'Album',
        slug: a.slug || a.id,
        description: a.description_en || '',
        photos: a.photos.map((p) => p.publicUrl)
      }))
    : photoAlbums) as PhotoAlbum[]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(album => (
        <PhotoAlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}
