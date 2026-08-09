export const metadata = { title: 'Admin — Asterot' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container">
      <header className="py-6 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Admin</header>
      <main>{children}</main>
    </div>
  )
}
