export type EventItem = {
  title: string
  description: string
  category: string
  date?: string
  tag: 'Upcoming' | 'Featured' | 'Past'
}

export type DocumentationItem = {
  title: string
  caption: string
  type: 'Photo' | 'Video'
}

export const upcomingEvents: EventItem[] = [
  {
    title: 'Student Uprising Memorial Cup Tournament',
    description: 'A sports tournament supported through sponsorship activity with Orion Group, bringing competitive energy and community engagement.',
    category: 'Sports',
    date: 'Details coming soon',
    tag: 'Featured'
  },
  {
    title: 'Corporate Leadership Conference',
    description: 'A premium conference designed for executives, entrepreneurs and young leaders to connect, learn and grow.',
    category: 'Corporate',
    tag: 'Upcoming'
  }
]

export const pastEvents: EventItem[] = [
  {
    title: 'Brand Launch & Opening Ceremony',
    description: 'Asterot\'s brand launch event featuring keynote moments and executive presence.',
    category: 'Corporate',
    date: '2025',
    tag: 'Past'
  },
  {
    title: 'Community Sports Day',
    description: 'A community gathering focused on sports, teamwork and local engagement.',
    category: 'Sports',
    date: '2025',
    tag: 'Past'
  }
]

export const documentationItems: DocumentationItem[] = [
  {
    title: 'Opening Ceremony Highlights',
    caption: 'Brand launch, keynote moments, and executive presence captured through premium event photography.',
    type: 'Photo'
  },
  {
    title: 'Sports & Community Events',
    caption: 'Live action from tournaments, team activations, and community engagement experiences.',
    type: 'Photo'
  },
  {
    title: 'Corporate Program Coverage',
    caption: 'Conference stages, networking moments, and corporate hospitality documented with clarity.',
    type: 'Video'
  },
  {
    title: 'Entertainment & Performances',
    caption: 'Backstage stories, performance highlights, and audience energy from live programs.',
    type: 'Video'
  }
]
