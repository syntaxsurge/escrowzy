'use client'

import { useEffect, useState } from 'react'

import { apiEndpoints } from '@/config/api-endpoints'
import { api } from '@/lib/api/http-client'

interface User {
  id: number
  walletAddress: string
  email: string | null
  name: string | null
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await api.get(apiEndpoints.user.profile)
        if (response.success) {
          setUser(response.data?.user || null)
        }
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
