export type MediaPhoto = {
  id: string
  title: string
  category: string
  src: string
  alt: string
}

export type MediaVideo = {
  title: string
  category: string
  year: string
  youtubeId?: string
  thumbnail: string
  duration?: string
}

export const videoCategories = [
  'Trailers',
  'Battle Grounds',
  'The Corporate Edit',
  'The Highlights',
  'Inside Asterot'
]

export type UpcomingProject = {
  title: string
  description: string
  statusLabel: string
  posterSrc: string
  trailerSrc?: string
}

export const upcomingProject: UpcomingProject = {
  title: 'Student Uprising Memorial Cup Tournament',
  description: 'An upcoming sports tournament delivered in partnership with Orion Group — bringing competitive energy, team spirit, and community engagement to audiences across Bangladesh.',
  statusLabel: 'Coming Soon',
  posterSrc: '/images/media/trailer/upcoming-poster.svg',
  trailerSrc: '/media/coming-soon-trailer.mp4'
}

export const mediaPhotos: MediaPhoto[] = [
  { id: 'spotlight-stage', title: 'Spotlight on the Main Stage', category: 'Opening Ceremony', src: '/images/media/photos/spotlight-stage.svg', alt: 'Spotlight illuminating the main stage at an Asterot opening ceremony' },
  { id: 'keynote-moment', title: 'Keynote Moments', category: 'Corporate', src: '/images/media/photos/keynote-moment.svg', alt: 'A keynote speaker presenting on stage during a corporate program' },
  { id: 'tournament-action', title: 'Tournament Action', category: 'Sports', src: '/images/media/photos/tournament-action.svg', alt: 'Live action from a sports tournament organized by Asterot' },
  { id: 'backstage-prep', title: 'Backstage Preparation', category: 'Behind the Scenes', src: '/images/media/photos/backstage-prep.svg', alt: 'The production crew preparing backstage before a show' },
  { id: 'crowd-energy', title: 'Live Crowd Energy', category: 'Entertainment', src: '/images/media/photos/crowd-energy.svg', alt: 'The audience reacting with energy during a live performance' },
  { id: 'brand-activation', title: 'Brand Activation', category: 'Branding', src: '/images/media/photos/brand-activation.svg', alt: 'A branded activation space engaging visitors at an event' },
  { id: 'team-crew', title: 'Team & Crew', category: 'Community', src: '/images/media/photos/team-crew.svg', alt: 'Asterot team members and event crew together on site' },
  { id: 'night-celebration', title: 'Night Celebration', category: 'Entertainment', src: '/images/media/photos/night-celebration.svg', alt: 'Festive moments captured during an evening celebration' }
]

export const mediaVideos: MediaVideo[] = [
  { title: 'Coming Soon Trailer', category: 'Trailers', year: '2026', duration: '0:09', youtubeId: 'g8g4JZXI2kc', thumbnail: 'https://img.youtube.com/vi/g8g4JZXI2kc/maxresdefault.jpg' },
  { title: 'Event Highlights 4', category: 'Trailers', year: '2026', youtubeId: 'Eldl_eaInFs', thumbnail: 'https://img.youtube.com/vi/Eldl_eaInFs/maxresdefault.jpg' },
  { title: 'Event Highlight', category: 'The Highlights', year: '2026', youtubeId: 'cr-l3XI9uy8', thumbnail: 'https://img.youtube.com/vi/cr-l3XI9uy8/maxresdefault.jpg' },
  { title: 'Event Highlight 2', category: 'The Highlights', year: '2026', youtubeId: 'Ejdd41z-qB4', thumbnail: 'https://img.youtube.com/vi/Ejdd41z-qB4/maxresdefault.jpg' },
  { title: 'Event Highlights', category: 'The Highlights', year: '2026', youtubeId: 'Zta8HAuUTWM', thumbnail: 'https://img.youtube.com/vi/Zta8HAuUTWM/maxresdefault.jpg' }
]
