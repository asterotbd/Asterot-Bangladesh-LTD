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
    slug: 'aiub-excels-as-runner-up-in-the-rising-generation-2025-football-tournament',
    title: 'AIUB Excels as Runner-Up in The Rising Generation 2025 Football Tournament',
    category: 'Latest News',
    excerpt: 'AIUB demonstrated exceptional skill, determination, and sportsmanship in The Rising Generation 2025 Football Tournament, finishing as the proud runner-up after a tense penalty shootout against Fareast International University.',
    content: [
      'The American International University-Bangladesh (AIUB) demonstrated exceptional skill, determination, and sportsmanship in The Rising Generation 2025 Football Tournament, finishing as the proud runner-up.',
      'In a thrilling and hard-fought final against Fareast International University, AIUB delivered an impressive performance, narrowly falling short in a tense penalty shootout that ended 2–1.',
      "AIUB's journey to the final highlighted their consistency and determination throughout the tournament. In the semifinal against Daffodil International University (DIU), AIUB secured a dramatic 3–2 victory in another penalty shootout.",
      'The Rising Generation 2025 Football Tournament was organized by Asterot Bangladesh Limited and held at Sher-e-Bangla Agricultural University on May 23, 2025.',
      'This tournament brought together university football teams in a competitive sporting event focused on teamwork, determination, sportsmanship, and the development of young athletes.',
      'Source: American International University-Bangladesh (AIUB) — https://aiub.edu/aiub-excels-as-runner-up-in-the-rising-generation-2025-football-tournament'
    ],
    date: 'May 28, 2025',
    image: '/media/photos/news/football-tournament-2025-runner-up.jpg',
    featured: true
  },
  {
    slug: 'diit-speedster-reaches-quarterfinals-at-rising-generation-football-tournament-2025',
    title: 'DIIT Speedster Reaches Quarterfinals at Rising Generation Football Tournament 2025',
    category: 'Latest News',
    excerpt: 'Daffodil Institute of IT (DIIT) Speedster battled their way to the quarterfinals of the Rising Generation Football Tournament 2025, organized by Asterot Bangladesh Limited, narrowly losing 1–0.',
    content: [
      'Daffodil Institute of IT (DIIT) Speedster stormed the pitch in the Rising Generation Football Tournament 2025, organized by Asterot Bangladesh Limited. From intense tackles to lightning-fast plays, the DIIT Speedster battled their way to the quarterfinals, proving they are a force to be reckoned with.',
      'In a nail-biting showdown, they gave it their all but narrowly lost 1–0. With heads held high and hearts full of passion, the team demonstrated true sporting spirit. This is just the beginning — the Speedsters will rise again.',
      'Source: Daffodil Institute of IT (DIIT) — https://www.facebook.com/DaffodilInstituteofIT/posts/1111350311024696/'
    ],
    date: 'May 26, 2025',
    image: '/media/photos/news/football-tournament-2025-diit-quarterfinals.jpg',
    featured: true
  },
  {
    slug: 'fareast-international-university-crowned-champions-of-rising-generation-2025-football-tournament',
    title: 'Fareast International University Crowned Champions of Rising Generation Inter University Football Tournament 2025',
    category: 'Latest News',
    excerpt: 'Fareast International University (FIU) has been crowned the champions of the Rising Generation Inter University Football Tournament 2025, triumphing over AIUB in a penalty shootout in the final after a 1–1 draw in regular time.',
    content: [
      'Fareast International University (FIU) has been crowned the champions of the Rising Generation Inter University Football Tournament 2025. In a thrilling one-day tournament, Team FIU displayed unstoppable determination and brilliance from the very first whistle.',
      'FIU topped their group undefeated, defeating Southeast University 4–0, Sonargaon University 3–0, and hosts Sher-e-Bangla Agricultural University 3–0. They then powered to a 5–1 victory over Shanto-Mariam University of Creative Technology in the quarterfinal and edged out Daffodil International University in a nail-biting semifinal, with Moin netting the winning goal in the dying minutes.',
      'In the final against AIUB, the match ended 1–1 in regular time before FIU triumphed 2–1 in the penalty shootout, thanks to a crucial save from goalkeeper Arman in the final moment.',
      'Moin Ahmed was honored as Man of the Final and Man of the Tournament, while Arman was named Best Goalkeeper of the Tournament.',
      'Source: Fareast International University (FIU) — https://www.facebook.com/fiu.edu.bd/posts/1155668126602316/'
    ],
    date: 'May 23, 2025',
    image: '/media/photos/news/football-tournament-2025-fiu-champions.jpg',
    featured: true
  }
]
