export type NewsArticle = {
  slug: string
  title: string
  category: 'Latest News' | 'Announcements' | 'Articles / Updates'
  excerpt: string
  content: string[]
  date: string
  image: string
  featured: boolean
}

export const newsCategories = ['Latest News', 'Announcements', 'Articles / Updates'] as const

export const newsArticles: NewsArticle[] = [
  {
    slug: 'asterot-bangladesh-limited-launches',
    title: 'Asterot Bangladesh Limited Launches to Deliver Premium Event Experiences',
    category: 'Announcements',
    excerpt: 'Asterot Bangladesh Limited officially launches as a premium event organization focused on sports, corporate, entertainment and marketing events across Bangladesh.',
    content: [
      'Asterot Bangladesh Limited has officially launched with a vision to deliver premium event experiences across Bangladesh. The organization combines strategic planning, polished production and collaborative partnerships to bring powerful events to life for audiences, communities and organizations.',
      'Asterot focuses on sports events and tournaments, corporate conferences and programs, entertainment productions and live performances, as well as branding and marketing activations. Each event is designed with clear goals, strong production and measurable outcomes.',
      'The organization is committed to working closely with sponsors, stakeholders and teams to deliver seamless experiences and trusted results. As Asterot grows, it will continue to expand its event portfolio and publish specific schedules and announcements.'
    ],
    date: '2025',
    image: '/media/photos/corporate-events/AUM09214.jpg',
    featured: true
  },
  {
    slug: 'student-uprising-memorial-cup-tournament-announcement',
    title: 'Student Uprising Memorial Cup Tournament — Strategic Partnership Announcement',
    category: 'Announcements',
    excerpt: 'Asterot supports the Student Uprising Memorial Cup Tournament through sponsorship activity with Orion Group, bringing competitive energy and community engagement.',
    content: [
      'Asterot Bangladesh Limited is pleased to support the Student Uprising Memorial Cup Tournament, a sports tournament delivered through strategic sponsorship activity with Orion Group.',
      'The tournament is designed to bring competitive energy and community engagement, uniting teams and audiences around the spirit of sport and shared purpose. Asterot supports this type of strategic event partnership and tournament delivery.',
      'Further details about the tournament schedule, teams and participation will be published as they become available. Those interested in registering can visit the registration page.'
    ],
    date: '2025',
    image: '/media/photos/tournament/1.jpeg',
    featured: true
  },
  {
    slug: 'corporate-leadership-conference-coming-soon',
    title: 'Corporate Leadership Conference — Coming Soon',
    category: 'Latest News',
    excerpt: 'Asterot is preparing a premium Corporate Leadership Conference designed for executives, entrepreneurs and young leaders to connect, learn and grow.',
    content: [
      'Asterot Bangladesh Limited is preparing a premium Corporate Leadership Conference designed for executives, entrepreneurs and young leaders.',
      'The conference will bring together voices across business, leadership and innovation, creating a space for connection, learning and growth. Sessions will focus on practical leadership, strategic thinking and building meaningful professional networks.',
      'More details about the conference agenda, speakers and registration will be announced soon. Stay tuned for updates.'
    ],
    date: '2025',
    image: '/media/photos/corporate-events/AUM09330.jpg',
    featured: true
  },
  {
    slug: 'brand-launch-and-opening-ceremony-highlights',
    title: 'Brand Launch & Opening Ceremony — Event Highlights',
    category: 'Articles / Updates',
    excerpt: 'A recap of Asterot\'s brand launch event featuring keynote moments and executive presence.',
    content: [
      'Asterot Bangladesh Limited celebrated its brand launch with an opening ceremony featuring keynote moments and executive presence.',
      'The event marked the beginning of Asterot\'s journey as a premium event organization and set the tone for the experiences the company aims to deliver across sports, corporate, entertainment and marketing categories.',
      'Photo and video documentation from the launch will be made available in the event documentation section.'
    ],
    date: '2025',
    image: '/media/photos/celebrations/1.JPG',
    featured: true
  }
]
