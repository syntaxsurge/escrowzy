import { envPublic } from '@/config/env.public'

export const appConfig = {
  name: envPublic.NEXT_PUBLIC_APP_NAME,
  description: envPublic.NEXT_PUBLIC_APP_DESCRIPTION,
  url: envPublic.NEXT_PUBLIC_APP_URL
}
