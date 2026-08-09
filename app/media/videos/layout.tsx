import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Videos',
  description: 'Video gallery from Asterot Bangladesh Limited — trailers, tournament highlights, corporate edits and more.',
  alternates: {
    canonical: 'https://www.asterot.com/media/videos'
  }
}

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children
}
