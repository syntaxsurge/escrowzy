import PusherClient from 'pusher-js'

import { apiEndpoints } from '@/config/api-endpoints'
import { envPublic } from '@/config/env.public'

export const pusherClient = envPublic.NEXT_PUBLIC_PUSHER_KEY
  ? new PusherClient(envPublic.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: envPublic.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      authEndpoint: apiEndpoints.pusher.auth
    })
  : null
