import PusherClient from 'pusher-js'

import { envPublic } from '@/config/env.public'

export const pusherClient =
  envPublic.NEXT_PUBLIC_PUSHER_KEY && envPublic.NEXT_PUBLIC_PUSHER_CLUSTER
    ? new PusherClient(envPublic.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: envPublic.NEXT_PUBLIC_PUSHER_CLUSTER
      })
    : null
