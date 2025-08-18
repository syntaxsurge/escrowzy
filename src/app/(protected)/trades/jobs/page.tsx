'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function JobsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to listings with service category
    router.replace('/trades/listings?category=service')
  }, [router])

  return null
}
