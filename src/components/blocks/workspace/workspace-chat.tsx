'use client'

import { useEffect, useRef, useState } from 'react'

import { format } from 'date-fns'
import { Paperclip, Send, Users } from 'lucide-react'
import useSWR from 'swr'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { pusherClient } from '@/lib/pusher-client'
import { api } from '@/lib/api/http-client'
import type { JobPostingWithRelations } from '@/lib/db/queries/jobs'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  content: string
  senderId: number
  sender: {
    id: number
    name: string
    avatarUrl: string | null
  }
  createdAt: Date
  attachments?: any[]
}

interface WorkspaceChatProps {
  jobId: number
  job: JobPostingWithRelations
  currentUser: any
}

export function WorkspaceChat({ jobId, job, currentUser }: WorkspaceChatProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch messages
  const { data: messages = [], mutate } = useSWR(
    `/api/jobs/${jobId}/messages`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).messages : []
    }
  )

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = pusherClient.subscribe(`job-${jobId}-chat`)

    channel.bind('new-message', (data: Message) => {
      mutate([...messages, data], false)
    })

    return () => {
      pusherClient.unsubscribe(`job-${jobId}-chat`)
    }
  }, [jobId, messages, mutate])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Send message
  const handleSend = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      await api.post(`/api/jobs/${jobId}/messages`, {
        content: message,
        contextType: 'job_workspace',
        contextId: jobId.toString()
      })
      setMessage('')
      mutate()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className='flex h-[600px] flex-col'>
      <CardHeader className='flex-none border-b'>
        <CardTitle className='flex items-center gap-2'>
          <Users className='h-4 w-4' />
          Project Chat
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Communicate with {job.client?.name} and team members
        </p>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col overflow-hidden p-0'>
        {/* Messages */}
        <ScrollArea ref={scrollRef} className='flex-1 p-4'>
          <div className='space-y-4'>
            {messages.map((msg: Message) => {
              const isCurrentUser = msg.senderId === currentUser.id
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isCurrentUser && 'flex-row-reverse'
                  )}
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={msg.sender.avatarUrl || undefined} />
                    <AvatarFallback>
                      {msg.sender.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'flex flex-col gap-1',
                      isCurrentUser && 'items-end'
                    )}
                  >
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span className='font-medium'>{msg.sender.name}</span>
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    </div>
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 max-w-md',
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className='text-sm whitespace-pre-wrap'>{msg.content}</p>
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className='mt-1 space-y-1'>
                        {msg.attachments.map((attachment: any, index: number) => (
                          <div
                            key={index}
                            className='flex items-center gap-2 text-xs text-muted-foreground'
                          >
                            <Paperclip className='h-3 w-3' />
                            <span className='underline'>{attachment.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div className='flex h-full items-center justify-center text-center'>
                <div>
                  <p className='text-sm font-medium'>No messages yet</p>
                  <p className='text-xs text-muted-foreground'>
                    Start a conversation about the project
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className='flex-none border-t p-4'>
          <div className='flex gap-2'>
            <Button variant='ghost' size='icon'>
              <Paperclip className='h-4 w-4' />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Type a message...'
              disabled={isLoading}
              className='flex-1'
            />
            <Button onClick={handleSend} disabled={isLoading || !message.trim()}>
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}