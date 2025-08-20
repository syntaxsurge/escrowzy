export interface Notification {
  id: string
  type?: string
  notificationType?: string
  title: string
  message: string
  read: boolean
  timestamp?: Date | string
  createdAt?: string
  actionUrl?: string | null
  teamName?: string | null
  metadata?: {
    url?: string
    actionType?: string
    actionLabel?: string
    [key: string]: any
  }
}
