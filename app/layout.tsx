import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from 'next-auth/react'
import { InactivityHandler } from '@/components/security/inactivity-handler'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quiniela Mundial 2026',
  description: 'Predice resultados del Mundial de la FIFA 2026 y compite con tus amigos en la quiniela',
  generator: 'v0.app',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏆</text></svg>',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          <SessionProvider>
            <InactivityHandler />
            {children}
            <Analytics />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
