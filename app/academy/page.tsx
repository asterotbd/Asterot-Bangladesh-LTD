import Container from '../../components/Container'

export default function AcademyPage(){
  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Academy</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Academy</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Introduction to the future academy.</p>
          </div>
        </Container>
      </section>
    </main>
  )
}
