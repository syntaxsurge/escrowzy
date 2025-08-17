'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

import {
  Search,
  BookOpen,
  Video,
  HelpCircle,
  Users,
  MessageCircle,
  ExternalLink
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [popularArticles, setPopularArticles] = useState<any[]>([])
  const [videoTutorials, setVideoTutorials] = useState<any[]>([])

  useEffect(() => {
    fetchHelpContent()
  }, [])

  const fetchHelpContent = async () => {
    try {
      // Fetch popular FAQ items
      const faqResponse = await fetch('/api/faq/popular?limit=6')
      const faqs = await faqResponse.json()
      setPopularArticles(faqs)

      // Fetch video tutorials
      const tutorialResponse = await fetch('/api/tutorials?type=video')
      const tutorials = await tutorialResponse.json()
      setVideoTutorials(tutorials.slice(0, 4))
    } catch (error) {
      console.error('Failed to fetch help content:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/help/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const helpCategories = [
    {
      icon: BookOpen,
      title: 'Getting Started',
      description: 'Learn the basics of using Escrowzy',
      href: '/help/getting-started',
      color: 'text-blue-500'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      href: '/help/tutorials',
      color: 'text-purple-500'
    },
    {
      icon: HelpCircle,
      title: 'FAQ',
      description: 'Find answers to common questions',
      href: '/help/faq',
      color: 'text-green-500'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with other users',
      href: '/help/community',
      color: 'text-orange-500'
    },
    {
      icon: MessageCircle,
      title: 'Contact Support',
      description: 'Get help from our support team',
      href: '/support',
      color: 'text-red-500'
    }
  ]

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      {/* Header */}
      <div className='mb-12 text-center'>
        <h1 className='mb-4 text-4xl font-bold'>Help Center</h1>
        <p className='text-muted-foreground mb-8 text-xl'>
          How can we help you today?
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className='mx-auto max-w-2xl'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform' />
            <Input
              type='search'
              placeholder='Search for help articles, tutorials, or FAQs...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='py-6 pr-4 pl-10 text-lg'
            />
            <Button
              type='submit'
              className='absolute top-1/2 right-2 -translate-y-1/2 transform'
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Help Categories Grid */}
      <div className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {helpCategories.map(category => {
          const Icon = category.icon
          return (
            <Link key={category.title} href={category.href}>
              <Card className='h-full cursor-pointer transition-shadow hover:shadow-lg'>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <Icon className={`h-8 w-8 ${category.color}`} />
                    <CardTitle>{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className='text-base'>
                    {category.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Tabs for Different Help Sections */}
      <Tabs defaultValue='popular' className='mb-12'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='popular'>Popular Articles</TabsTrigger>
          <TabsTrigger value='videos'>Video Tutorials</TabsTrigger>
          <TabsTrigger value='updates'>Recent Updates</TabsTrigger>
        </TabsList>

        <TabsContent value='popular' className='mt-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {popularArticles.map(article => (
              <Card
                key={article.id}
                className='transition-shadow hover:shadow-md'
              >
                <CardHeader>
                  <CardTitle className='text-lg'>{article.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground line-clamp-2'>
                    {article.answer}
                  </p>
                  <Link
                    href={`/help/faq/${article.categorySlug}#${article.id}`}
                    className='text-primary mt-2 inline-flex items-center gap-1 text-sm hover:underline'
                  >
                    Read more <ExternalLink className='h-3 w-3' />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='videos' className='mt-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {videoTutorials.map(tutorial => (
              <Card
                key={tutorial.id}
                className='transition-shadow hover:shadow-md'
              >
                <CardContent className='p-4'>
                  <div className='bg-muted mb-3 flex aspect-video items-center justify-center rounded-md'>
                    <Video className='text-muted-foreground h-12 w-12' />
                  </div>
                  <h4 className='mb-1 text-sm font-semibold'>
                    {tutorial.title}
                  </h4>
                  <p className='text-muted-foreground text-xs'>
                    {tutorial.estimatedTime} min
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='updates' className='mt-6'>
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>
                  New Tutorial: Advanced Trading Strategies
                </CardTitle>
                <CardDescription>2 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Learn advanced techniques for maximizing your escrow trading
                  efficiency.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>
                  Updated: Security Best Practices
                </CardTitle>
                <CardDescription>1 week ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  We've updated our security guidelines with the latest
                  recommendations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>
                  New Feature: Multi-Signature Escrows
                </CardTitle>
                <CardDescription>2 weeks ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Documentation for our new multi-signature escrow feature is
                  now available.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            <Button variant='outline' asChild>
              <Link href='/support'>Contact Support</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/help/community'>Community Forum</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/help/api-docs'>API Documentation</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/help/glossary'>Glossary</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
