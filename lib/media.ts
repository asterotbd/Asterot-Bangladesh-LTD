export type MediaVideo = {
  id: string
  videoType?: 'video' | 'short'
  title: string
  category: string
  year: string
  youtubeId?: string
  thumbnail: string
  duration?: string
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
  posterSrc: '/images/media/trailer/upcoming-poster.svg',
  trailerSrc: '/media/coming-soon-trailer.mp4'
}
