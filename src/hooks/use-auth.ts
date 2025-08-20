'use client'

import { useEffect, useState } from 'react'

import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'
import type { User } from '@/lib/db/schema/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await api.get(apiEndpoints.user.profile)
        setUser(response?.user || null)
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading }
}
