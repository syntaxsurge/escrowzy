'use client'

import { useState } from 'react'

import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  MessageSquare,
  Copy,
  Mail,
  Send,
  Check
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib'

interface SocialShareProps {
  url?: string
  title?: string
  description?: string
  hashtags?: string[]
  contentType?:
    | 'job'
    | 'profile'
    | 'achievement'
    | 'trade'
    | 'article'
    | 'general'
  contentId?: number | string
  className?: string
  variant?: 'button' | 'dropdown' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  trackShares?: boolean
}

const SHARE_PLATFORMS = {
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: 'text-[#1DA1F2]',
    shareUrl: (url: string, text: string, hashtags?: string[]) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}${hashtags ? `&hashtags=${hashtags.join(',')}` : ''}`
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'text-[#1877F2]',
    shareUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-[#0A66C2]',
    shareUrl: (url: string, title: string, summary?: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}${summary ? `&summary=${encodeURIComponent(summary)}` : ''}`
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: MessageSquare,
    color: 'text-[#25D366]',
    shareUrl: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
  },
  telegram: {
    name: 'Telegram',
    icon: Send,
    color: 'text-[#0088cc]',
    shareUrl: (url: string, text: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
  email: {
    name: 'Email',
    icon: Mail,
    color: 'text-gray-600',
    shareUrl: (url: string, subject: string, body?: string) =>
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body || url)}`
  }
}

export function SocialSharing({
  url: providedUrl,
  title = 'Check this out on Escrowzy',
  description = 'Secure P2P trading and freelance marketplace',
  hashtags = ['escrowzy', 'crypto', 'freelance'],
  contentType = 'general',
  contentId,
  className,
  variant = 'dropdown',
  size = 'md',
  showLabels = false,
  trackShares = true
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [customShareOpen, setCustomShareOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const { toast } = useToast()

  // Use current URL if not provided
  const shareUrl =
    providedUrl || (typeof window !== 'undefined' ? window.location.href : '')

  const trackShare = async (platform: string) => {
    if (!trackShares) return

    try {
      await fetch('/api/social-shares/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          contentType,
          contentId,
          shareUrl,
          customMessage
        })
      })
    } catch (error) {
      console.error('Failed to track share:', error)
    }
  }

  const handleShare = (platform: keyof typeof SHARE_PLATFORMS) => {
    const platformConfig = SHARE_PLATFORMS[platform]
    let shareLink = ''

    switch (platform) {
      case 'twitter':
        shareLink = platformConfig.shareUrl(
          shareUrl,
          customMessage || title,
          hashtags
        )
        break
      case 'facebook':
        shareLink = platformConfig.shareUrl(shareUrl)
        break
      case 'linkedin':
        shareLink = platformConfig.shareUrl(shareUrl, title, description)
        break
      case 'whatsapp':
      case 'telegram':
        shareLink = platformConfig.shareUrl(shareUrl, customMessage || title)
        break
      case 'email':
        shareLink = platformConfig.shareUrl(
          shareUrl,
          title,
          `${description}\n\n${shareUrl}`
        )
        break
    }

    window.open(shareLink, '_blank', 'width=600,height=400')
    trackShare(platform)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Link copied!',
        description: 'The link has been copied to your clipboard.',
        duration: 2000
      })
      trackShare('copy')
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try copying the link manually.',
        variant: 'destructive'
      })
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl
        })
        trackShare('native')
      } catch (error) {
        // User cancelled or error occurred
        console.error('Share failed:', error)
      }
    }
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {Object.entries(SHARE_PLATFORMS)
          .slice(0, 4)
          .map(([key, platform]) => {
            const Icon = platform.icon
            return (
              <Button
                key={key}
                variant='ghost'
                size='icon'
                className={cn(sizeClasses[size], platform.color)}
                onClick={() => handleShare(key as keyof typeof SHARE_PLATFORMS)}
                title={`Share on ${platform.name}`}
              >
                <Icon className='h-4 w-4' />
              </Button>
            )
          })}
        <Button
          variant='ghost'
          size='icon'
          className={sizeClasses[size]}
          onClick={handleCopyLink}
          title='Copy link'
        >
          {copied ? (
            <Check className='h-4 w-4' />
          ) : (
            <Copy className='h-4 w-4' />
          )}
        </Button>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <>
        <Button
          onClick={() => setCustomShareOpen(true)}
          className={cn('gap-2', className)}
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        >
          <Share2 className='h-4 w-4' />
          {showLabels && 'Share'}
        </Button>

        <Dialog open={customShareOpen} onOpenChange={setCustomShareOpen}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Share</DialogTitle>
              <DialogDescription>
                Share this {contentType} with your network
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* Custom message */}
              <div>
                <label className='mb-2 block text-sm font-medium'>
                  Custom message (optional)
                </label>
                <Textarea
                  placeholder='Add a personal message...'
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Share platforms */}
              <div className='grid grid-cols-3 gap-3'>
                {Object.entries(SHARE_PLATFORMS).map(([key, platform]) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        handleShare(key as keyof typeof SHARE_PLATFORMS)
                      }
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg p-3',
                        'hover:bg-muted transition-colors'
                      )}
                    >
                      <Icon className={cn('h-6 w-6', platform.color)} />
                      <span className='text-xs'>{platform.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Copy link */}
              <div className='flex items-center gap-2'>
                <Input value={shareUrl} readOnly className='flex-1' />
                <Button onClick={handleCopyLink} size='icon' variant='outline'>
                  {copied ? (
                    <Check className='h-4 w-4' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>

              {/* Native share (mobile) */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button
                  onClick={handleNativeShare}
                  className='w-full'
                  variant='outline'
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  More sharing options
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className={cn(sizeClasses[size], className)}
        >
          <Share2 className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>Share</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(SHARE_PLATFORMS).map(([key, platform]) => {
          const Icon = platform.icon
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleShare(key as keyof typeof SHARE_PLATFORMS)}
              className='cursor-pointer'
            >
              <Icon className={cn('mr-2 h-4 w-4', platform.color)} />
              {platform.name}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyLink} className='cursor-pointer'>
          {copied ? (
            <>
              <Check className='mr-2 h-4 w-4' />
              Copied!
            </>
          ) : (
            <>
              <Copy className='mr-2 h-4 w-4' />
              Copy link
            </>
          )}
        </DropdownMenuItem>

        {typeof navigator !== 'undefined' && navigator.share && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleNativeShare}
              className='cursor-pointer'
            >
              <Share2 className='mr-2 h-4 w-4' />
              More options
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Share stats component
export function ShareStats({
  contentType,
  contentId
}: {
  contentType: string
  contentId: number | string
}) {
  const [stats, setStats] = useState<any>(null)

  // Fetch share stats
  // Implementation would fetch from API

  if (!stats) return null

  return (
    <div className='text-muted-foreground flex items-center gap-4 text-sm'>
      <span>{stats.totalShares} shares</span>
      <span>{stats.clicks} clicks</span>
    </div>
  )
}
