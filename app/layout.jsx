import './globals.css'
import { Providers } from '@/providers'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'J&S Gestión Mecánica',
  description: 'Software de gestión para talleres mecánicos con foco en control operativo, seguimiento comercial y una imagen profesional.',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#0F1115',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
