'use client'

import { ClientOnly } from '@/components/client-only'
import { Footer } from '@/components/layout/footer'
import Header from '@/components/layout/header'
import { AuthDependentProviders } from '@/components/providers/auth-dependent-providers'
import { useSubscriptionValidation } from '@/hooks/use-subscription-validation'

function LayoutWithSubscriptionValidation({
  children
}: {
  children: React.ReactNode
}) {
  // Validate subscription status on mount and when focus changes
  useSubscriptionValidation()

  return (
    <section className='bg-background text-foreground flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>{children}</main>
      <Footer />
    </section>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <AuthDependentProviders>
        <LayoutWithSubscriptionValidation>
          {children}
        </LayoutWithSubscriptionValidation>
      </AuthDependentProviders>
    </ClientOnly>
  )
}
