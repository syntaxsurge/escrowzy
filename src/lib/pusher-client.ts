import PusherClient from 'pusher-js'

import { envPublic } from '@/config/env.public'

export const pusherClient = envPublic.NEXT_PUBLIC_PUSHER_KEY
  ? new PusherClient(envPublic.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: envPublic.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      authEndpoint: '/api/pusher/auth'
    })
  : null
