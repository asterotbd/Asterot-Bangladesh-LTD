export type PhotoAlbum = {
  id: string
  title: string
  slug: string
  description: string
  photos: string[]
}

export const photoAlbums: PhotoAlbum[] = [
  {
    id: 'tournament',
    title: 'Tournament',
    slug: 'tournament',
    description: 'A collection of moments from our tournaments.',
    photos: []
  },
  {
    id: 'corporate-events',
    title: 'Corporate Events',
    slug: 'corporate-events',
    description: 'A collection of moments from our corporate events.',
    photos: [
      '/media/photos/corporate-events/AUM09214.jpg',
      '/media/photos/corporate-events/AUM09255.jpg',
      '/media/photos/corporate-events/AUM09320.jpg',
      '/media/photos/corporate-events/AUM09330.jpg',
      '/media/photos/corporate-events/AUM09331.jpg',
      '/media/photos/corporate-events/AUM09334.jpg',
      '/media/photos/corporate-events/AUM09353.jpg',
      '/media/photos/corporate-events/AUM09395.jpg',
      '/media/photos/corporate-events/AUM09405.jpg',
      '/media/photos/corporate-events/AUM09505.jpg',
      '/media/photos/corporate-events/AUM09506.jpg',
      '/media/photos/corporate-events/AUM09550.jpg',
      '/media/photos/corporate-events/AUM09568.jpg'
    ]
  },
  {
    id: 'other-events',
    title: 'Other Events',
    slug: 'other-events',
    description: 'A collection of moments from our other events.',
    photos: []
  },
  {
    id: 'backstage-stories',
    title: 'Backstage Stories',
    slug: 'backstage-stories',
    description: 'A collection of backstage stories from behind the scenes.',
    photos: []
  },
  {
    id: 'the-crew',
    title: 'The Crew',
    slug: 'the-crew',
    description: 'A collection of moments featuring the crew.',
    photos: []
  },
  {
    id: 'celebrations',
    title: 'Celebrations',
    slug: 'celebrations',
    description: 'A collection of moments from our celebrations.',
    photos: []
  },
  {
    id: 'opening-ceremony',
    title: 'Opening Ceremony',
    slug: 'opening-ceremony',
    description: 'A collection of moments from our opening ceremonies.',
    photos: []
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    slug: 'entertainment',
    description: 'A collection of moments from our entertainment shows.',
    photos: []
  },
  {
    id: 'community',
    title: 'Community',
    slug: 'community',
    description: 'A collection of moments from our community work.',
    photos: []
  }
]

export function getAlbumBySlug(slug: string): PhotoAlbum | undefined {
  return photoAlbums.find(album => album.slug === slug)
}

export function getAlbumPhotoCount(album: PhotoAlbum): number {
  return album.photos.length
}
