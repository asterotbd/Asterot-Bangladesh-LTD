import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import MediaTrailer from '../../components/MediaTrailer'
import PhotoGallery from '../../components/PhotoGallery'
import VideoGallery from '../../components/VideoGallery'

export default function MediaPage() {
  return (
    <main className="bg-black text-white">
      <MediaTrailer />

      {/* Photos */}
      <section className="py-16 sm:py-20">
        <Container>
          <RevealSection>
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Gallery</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Photos</h2>
              <p className="mt-4 text-gray-300">
                A look behind the scenes, our projects, people, and moments.
              </p>
            </div>
          </RevealSection>

          <RevealSection className="mt-10">
            <PhotoGallery />
          </RevealSection>
        </Container>
      </section>

      {/* Videos */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <RevealSection>
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Film</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Videos</h2>
              <p className="mt-4 text-gray-300">
                Watch our latest projects, stories, events, and behind-the-scenes moments.
              </p>
            </div>
          </RevealSection>

          <RevealSection className="mt-10">
            <VideoGallery />
          </RevealSection>
        </Container>
      </section>
    </main>
  )
}
