'use client'

import { useEffect, useRef, useState } from 'react'

import { format } from 'date-fns'
import { Paperclip, Send } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { pusherClient } from '@/lib/pusher-client'
import { useSession } from '@/hooks/use-session'
import { api } from '@/lib/api/http-client'
import type { BidWithRelations } from '@/lib/db/queries/bids'

interface BidMessage {
  id: number
  bidId: number
  senderId: number
  message: string
  attachments?: any[]
  messageType: 'text' | 'offer' | 'revision_request' | 'terms_change'
  metadata?: {
    newAmount?: string
    newDeliveryDays?: number
    newTerms?: string
  }
  createdAt: string
  sender?: {
    id: number
    name: string
    avatarUrl: string | null
  }
}

interface BidNegotiationChatProps {
  bid: BidWithRelations
  jobTitle: string
  isClient: boolean
  onTermsAccepted?: () => void
}

export function BidNegotiationChat({
  bid,
  jobTitle,
  isClient,
  onTermsAccepted
}: BidNegotiationChatProps) {
  const { user } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    mutate: mutateMessages
  } = useSWR<BidMessage[]>(
    isOpen ? `/api/jobs/${bid.jobId}/bids/${bid.id}/messages` : null,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.messages : []
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false
    }
  )

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isOpen || !user) return

    const channel = pusherClient.subscribe(`bid-${bid.id}`)
    
    channel.bind('new-message', (data: BidMessage) => {
      mutateMessages((prev = []) => [...prev, data], false)
      scrollToBottom()
    })

    channel.bind('terms-updated', (data: any) => {
      toast.info('Bid terms have been updated')
      mutateMessages()
    })

    return () => {
      pusherClient.unsubscribe(`bid-${bid.id}`)
    }
  }, [isOpen, bid.id, user, mutateMessages])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    const messageText = message.trim()
    setMessage('')
    setIsSending(true)

    try {
      const response = await api.post(
        `/api/jobs/${bid.jobId}/bids/${bid.id}/messages`,
        {
          message: messageText,
          messageType: 'text'
        }
      )

      if (response.success) {
        mutateMessages()
      } else {
        toast.error(response.error || 'Failed to send message')
        setMessage(messageText) // Restore message on error
      }
    } catch (error) {
      toast.error('Failed to send message')
      setMessage(messageText)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleMakeOffer = async (newAmount: string, newDeliveryDays: number) => {
    setIsSending(true)

    try {
      const response = await api.post(
        `/api/jobs/${bid.jobId}/bids/${bid.id}/messages`,
        {
          message: `New offer: $${newAmount} in ${newDeliveryDays} days`,
          messageType: 'offer',
          metadata: {
            newAmount,
            newDeliveryDays
          }
        }
      )

      if (response.success) {
        toast.success('Offer sent successfully')
        mutateMessages()
      } else {
        toast.error(response.error || 'Failed to send offer')
      }
    } catch (error) {
      toast.error('Failed to send offer')
    } finally {
      setIsSending(false)
    }
  }

  const renderMessage = (msg: BidMessage) => {
    const isOwnMessage = msg.senderId === user?.id

    return (
      <div
        key={msg.id}
        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <Avatar className='h-8 w-8'>
          <AvatarImage src={msg.sender?.avatarUrl || ''} />
          <AvatarFallback>
            {msg.sender?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div
          className={`max-w-[70%] space-y-1 ${
            isOwnMessage ? 'items-end' : 'items-start'
          }`}
        >
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span>{msg.sender?.name || 'Unknown'}</span>
            <span>•</span>
            <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
          </div>
          
          <div
            className={`rounded-lg px-3 py-2 ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {msg.messageType === 'offer' && msg.metadata && (
              <div className='mb-2 space-y-1'>
                <Badge variant='secondary' className='mb-1'>
                  New Offer
                </Badge>
                <div className='text-sm font-medium'>
                  Amount: ${msg.metadata.newAmount}
                </div>
                <div className='text-sm'>
                  Delivery: {msg.metadata.newDeliveryDays} days
                </div>
              </div>
            )}
            
            <p className='text-sm whitespace-pre-wrap'>{msg.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' size='sm'>
          <MessageSquare className='mr-2 h-4 w-4' />
          Negotiate
        </Button>
      </SheetTrigger>
      <SheetContent className='w-[400px] sm:w-[540px]'>
        <SheetHeader>
          <SheetTitle>Negotiation Chat</SheetTitle>
          <SheetDescription>
            Discuss terms with {isClient ? bid.freelancer?.name : 'the client'} for "{jobTitle}"
          </SheetDescription>
        </SheetHeader>

        <div className='mt-4 flex h-[calc(100vh-200px)] flex-col'>
          {/* Current Terms */}
          <Card className='mb-4'>
            <CardHeader className='py-3'>
              <CardTitle className='text-sm'>Current Terms</CardTitle>
            </CardHeader>
            <CardContent className='py-3'>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div>
                  <span className='text-muted-foreground'>Amount:</span>{' '}
                  <strong>${bid.bidAmount}</strong>
                </div>
                <div>
                  <span className='text-muted-foreground'>Delivery:</span>{' '}
                  <strong>{bid.deliveryDays} days</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className='flex-1 px-2'>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='animate-pulse text-muted-foreground'>
                  Loading messages...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <MessageSquare className='mb-2 h-12 w-12 text-muted-foreground/50' />
                <p className='text-sm text-muted-foreground'>
                  No messages yet. Start the negotiation!
                </p>
              </div>
            ) : (
              <div className='space-y-4 py-4'>
                {messages.map(renderMessage)}
                <div ref={messageEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className='mt-4 border-t pt-4'>
            <div className='flex gap-2'>
              <Input
                placeholder='Type your message...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSending}
                className='flex-1'
              />
              <Button
                size='icon'
                variant='ghost'
                disabled
                title='Attachments coming soon'
              >
                <Paperclip className='h-4 w-4' />
              </Button>
              <Button
                size='icon'
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
              >
                <Send className='h-4 w-4' />
              </Button>
            </div>
            
            {/* Quick Actions */}
            {isClient && bid.status === 'pending' && (
              <div className='mt-3 flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    const newAmount = prompt('Enter new amount:', bid.bidAmount)
                    const newDays = prompt('Enter new delivery days:', bid.deliveryDays.toString())
                    if (newAmount && newDays) {
                      handleMakeOffer(newAmount, parseInt(newDays))
                    }
                  }}
                >
                  Make Counter Offer
                </Button>
                <Button
                  size='sm'
                  variant='default'
                  onClick={onTermsAccepted}
                >
                  Accept Current Terms
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Import this for the MessageSquare icon
import { MessageSquare } from 'lucide-react'