export type MediaPhoto = {
  id: string
  title: string
  category: string
  src: string
  alt: string
}

export type MediaVideo = {
  id: string
  title: string
  category: string
  date: string
  duration: string
  src?: string
  thumb: string
}

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
  posterSrc: '/images/media/trailer/upcoming-poster.svg'
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
  { id: 'opening-ceremony-highlights', title: 'Opening Ceremony Highlights', category: 'Corporate', date: '2025', duration: '2:45', thumb: '/images/media/videos/opening-ceremony-highlights.svg' },
  { id: 'memorial-cup-aftermovie', title: 'Memorial Cup Aftermovie', category: 'Sports', date: '2025', duration: '4:12', thumb: '/images/media/videos/memorial-cup-aftermovie.svg' },
  { id: 'backstage-stories', title: 'Backstage Stories', category: 'Behind the Scenes', date: '2025', duration: '3:08', thumb: '/images/media/videos/backstage-stories.svg' },
  { id: 'brand-launch-reel', title: 'Brand Launch Reel', category: 'Branding', date: '2025', duration: '1:56', thumb: '/images/media/videos/brand-launch-reel.svg' }
]
