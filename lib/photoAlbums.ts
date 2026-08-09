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
    photos: [
      '/media/photos/tournament/1.jpeg',
      '/media/photos/tournament/2.JPG',
      '/media/photos/tournament/3.jpeg',
      '/media/photos/tournament/4.JPG',
      '/media/photos/tournament/5.jpeg',
      '/media/photos/tournament/6.JPG',
      '/media/photos/tournament/7.JPG',
      '/media/photos/tournament/8.JPG',
      '/media/photos/tournament/9.JPG',
      '/media/photos/tournament/10.JPG',
      '/media/photos/tournament/11.jpeg',
      '/media/photos/tournament/12.JPG',
      '/media/photos/tournament/13.jpeg',
      '/media/photos/tournament/14.jpeg',
      '/media/photos/tournament/15.JPG',
      '/media/photos/tournament/16.JPG',
      '/media/photos/tournament/17.JPG',
      '/media/photos/tournament/18.JPG',
      '/media/photos/tournament/19.jpeg',
      '/media/photos/tournament/20.JPG',
      '/media/photos/tournament/21.jpeg'
    ]
  },
  {
    id: 'corporate-events',
    title: 'Corporate Events',
    slug: 'corporate-events',
    description: 'A collection of moments from our corporate events.',
    photos: [
      '/media/photos/corporate-events/AUM09214.jpg',
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
    photos: [
      '/media/photos/other-events/1.JPG',
      '/media/photos/other-events/2.JPG',
      '/media/photos/other-events/3.jpeg',
      '/media/photos/other-events/4.jpeg',
      '/media/photos/other-events/5.JPG',
      '/media/photos/other-events/6.jpg',
      '/media/photos/other-events/7.jpg',
      '/media/photos/other-events/8.jpeg',
      '/media/photos/other-events/9.JPG'
    ]
  },
  {
    id: 'backstage-stories',
    title: 'Backstage Stories',
    slug: 'backstage-stories',
    description: 'A collection of backstage stories from behind the scenes.',
    photos: [
      '/media/photos/backstage-stories/1.JPG',
      '/media/photos/backstage-stories/2.jpg',
      '/media/photos/backstage-stories/3.jpg',
      '/media/photos/backstage-stories/4.jpg',
      '/media/photos/backstage-stories/5.JPG',
      '/media/photos/backstage-stories/6.jpg',
      '/media/photos/backstage-stories/7.jpg',
      '/media/photos/backstage-stories/8.jpg',
      '/media/photos/backstage-stories/9.jpg',
      '/media/photos/backstage-stories/10.jpeg',
      '/media/photos/backstage-stories/11.jpg'
    ]
  },
  {
    id: 'the-crew',
    title: 'The Crew',
    slug: 'the-crew',
    description: 'A collection of moments featuring the crew.',
    photos: [
      '/media/photos/the-crew/1.jpg',
      '/media/photos/the-crew/2.jpg',
      '/media/photos/the-crew/3.png',
      '/media/photos/the-crew/4.jpeg',
      '/media/photos/the-crew/5.png',
      '/media/photos/the-crew/6.jpg',
      '/media/photos/the-crew/7.jpeg',
      '/media/photos/the-crew/8.jpeg',
      '/media/photos/the-crew/9.jpeg',
      '/media/photos/the-crew/10.jpg'
    ]
  },
  {
    id: 'celebrations',
    title: 'Celebrations',
    slug: 'celebrations',
    description: 'A collection of moments from our celebrations.',
    photos: [
      '/media/photos/celebrations/1.JPG',
      '/media/photos/celebrations/2.jpg',
      '/media/photos/celebrations/3.JPG',
      '/media/photos/celebrations/4.JPG',
      '/media/photos/celebrations/5.JPG',
      '/media/photos/celebrations/6.JPG',
      '/media/photos/celebrations/7.JPG',
      '/media/photos/celebrations/8.JPG',
      '/media/photos/celebrations/9.JPG',
      '/media/photos/celebrations/10.JPG',
      '/media/photos/celebrations/11.JPG'
    ]
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
