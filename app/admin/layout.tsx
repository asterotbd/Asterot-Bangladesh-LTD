import '../../styles/globals.css'

export const metadata = { title: 'Admin - Asterot' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="container">
          <header className="py-6">Admin Panel (protected area placeholder)</header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
