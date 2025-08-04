import './globals.css'
import { Manrope } from 'next/font/google'

import type { Metadata, Viewport } from 'next'
import { SWRConfig } from 'swr'

import { DatabaseHealthCheck } from '@/components/blocks/health/database-health-check'
import { Providers } from '@/components/providers'
import { appConfig } from '@/config/app-config'
import { appRoutes } from '@/config/app-routes'
import { swrConfig } from '@/lib/api/swr'

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  icons: { icon: appRoutes.assets.favicon }
}

export const viewport: Viewport = {
  maximumScale: 1
}

const manrope = Manrope({ subsets: ['latin'] })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className={manrope.className} suppressHydrationWarning>
      <body className='bg-background text-foreground flex min-h-[100dvh] flex-col'>
        <DatabaseHealthCheck>
          <Providers>
            <SWRConfig value={swrConfig}>
              <div className='flex-1'>{children}</div>
            </SWRConfig>
          </Providers>
        </DatabaseHealthCheck>
      </body>
    </html>
  )
}
