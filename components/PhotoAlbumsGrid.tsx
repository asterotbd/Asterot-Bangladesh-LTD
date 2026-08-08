import PhotoAlbumCard from './PhotoAlbumCard'
import { photoAlbums } from '../lib/photoAlbums'

export default function PhotoAlbumsGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {photoAlbums.map(album => (
        <PhotoAlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}
