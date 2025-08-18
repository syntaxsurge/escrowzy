'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { appRoutes } from '@/config/app-routes'

export default function ServicesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to freelancers page as Services page
    router.replace(appRoutes.freelancers)
  }, [router])

  return null
}
