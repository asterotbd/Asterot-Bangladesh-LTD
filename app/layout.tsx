import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { AuthProvider } from '../components/AuthProvider'

export const metadata = {
  metadataBase: new URL('https://www.asterot.com'),
  title: {
    default: 'Asterot Bangladesh Limited',
    template: '%s | Asterot Bangladesh Limited'
  },
  description: 'Igniting Tomorrow\'s Leaders — Awaken Greatness',
  icons: {
    icon: '/favicon.png'
  },
  openGraph: {
    type: 'website',
    siteName: 'Asterot Bangladesh Limited',
    locale: 'en_US'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-black text-white overflow-x-hidden">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
        <Footer />
      </body>
    </html>
  )
}
