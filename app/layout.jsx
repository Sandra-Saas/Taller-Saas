import './globals.css'
import { Providers } from '@/providers'

export const metadata = {
  title: 'Taller SaaS',
  description: 'Plataforma SaaS para talleres mecánicos',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
