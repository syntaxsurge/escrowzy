'use client'

import { useState, useEffect } from 'react'

import { Search, ThumbsUp, ThumbsDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface FaqCategory {
  id: number
  name: string
  slug: string
  description: string
  itemCount: number
}

interface FaqItem {
  id: number
  categoryId: number
  question: string
  answer: string
  helpfulCount: number
  notHelpfulCount: number
  viewCount: number
  featured: boolean
}

export default function FAQPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FaqItem[]>([])
  const [votedItems, setVotedItems] = useState<Set<number>>(new Set())
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    faqId: number | null
  }>({
    isOpen: false,
    faqId: null
  })
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchFaqItems()
  }, [])

  useEffect(() => {
    if (selectedCategory !== 'all') {
      fetchCategoryFaqs(selectedCategory)
    } else {
      fetchFaqItems()
    }
  }, [selectedCategory])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchFaqs()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/faq/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchFaqItems = async () => {
    try {
      const response = await fetch('/api/faq/highlighted')
      const data = await response.json()
      setFaqItems(data)
    } catch (error) {
      console.error('Failed to fetch FAQ items:', error)
    }
  }

  const fetchCategoryFaqs = async (slug: string) => {
    try {
      const response = await fetch(`/api/faq/category/${slug}`)
      const data = await response.json()
      setFaqItems(data)
    } catch (error) {
      console.error('Failed to fetch category FAQs:', error)
    }
  }

  const searchFaqs = async () => {
    try {
      const response = await fetch(
        `/api/faq/search?q=${encodeURIComponent(searchQuery)}`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Failed to search FAQs:', error)
    }
  }

  const handleVote = async (faqId: number, isHelpful: boolean) => {
    if (votedItems.has(faqId)) {
      toast.error('You have already voted on this item')
      return
    }

    try {
      const response = await fetch('/api/faq/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqId, isHelpful })
      })

      if (response.ok) {
        setVotedItems(prev => new Set(prev).add(faqId))

        if (!isHelpful) {
          setFeedbackModal({ isOpen: true, faqId })
        } else {
          toast.success('Thank you for your feedback!')
        }

        // Update local state
        setFaqItems(prev =>
          prev.map(item =>
            item.id === faqId
              ? {
                  ...item,
                  helpfulCount: isHelpful
                    ? item.helpfulCount + 1
                    : item.helpfulCount,
                  notHelpfulCount: !isHelpful
                    ? item.notHelpfulCount + 1
                    : item.notHelpfulCount
                }
              : item
          )
        )
      }
    } catch (error) {
      console.error('Failed to submit vote:', error)
      toast.error('Failed to submit your vote')
    }
  }

  const submitFeedback = async () => {
    if (!feedbackModal.faqId) return

    try {
      await fetch('/api/faq/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faqId: feedbackModal.faqId,
          isHelpful: false,
          feedback: feedbackText
        })
      })

      toast.success('Thank you for your detailed feedback!')
      setFeedbackModal({ isOpen: false, faqId: null })
      setFeedbackText('')
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const displayItems = searchQuery.length >= 2 ? searchResults : faqItems

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='mb-4 text-4xl font-bold'>Frequently Asked Questions</h1>
        <p className='text-muted-foreground text-xl'>
          Find answers to common questions about Escrowzy
        </p>
      </div>

      {/* Search Bar */}
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform' />
            <Input
              type='search'
              placeholder='Search FAQs...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
          {searchQuery.length >= 2 && (
            <p className='text-muted-foreground mt-2 text-sm'>
              Found {searchResults.length} result
              {searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <div className='mb-8'>
        <h2 className='mb-4 text-2xl font-semibold'>Browse by Category</h2>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size='sm'
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={
                selectedCategory === category.slug ? 'default' : 'outline'
              }
              onClick={() => setSelectedCategory(category.slug)}
              size='sm'
            >
              {category.name}
              <Badge variant='secondary' className='ml-2'>
                {category.itemCount}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCategory === 'all'
              ? 'All Questions'
              : categories.find(c => c.slug === selectedCategory)?.name ||
                'Questions'}
          </CardTitle>
          <CardDescription>
            Click on a question to view the answer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type='single' collapsible className='w-full'>
            {displayItems.map(item => (
              <AccordionItem key={item.id} value={`item-${item.id}`}>
                <AccordionTrigger className='text-left'>
                  <div className='flex items-start gap-2 pr-4'>
                    {item.featured && (
                      <Badge variant='secondary' className='shrink-0'>
                        Featured
                      </Badge>
                    )}
                    <span>{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className='space-y-4'>
                    <div className='prose prose-sm text-muted-foreground max-w-none'>
                      {item.answer}
                    </div>

                    {/* Helpfulness Vote */}
                    <div className='flex items-center gap-4 border-t pt-4'>
                      <span className='text-muted-foreground text-sm'>
                        Was this helpful?
                      </span>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleVote(item.id, true)}
                          disabled={votedItems.has(item.id)}
                        >
                          <ThumbsUp className='mr-1 h-4 w-4' />
                          Yes ({item.helpfulCount})
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleVote(item.id, false)}
                          disabled={votedItems.has(item.id)}
                        >
                          <ThumbsDown className='mr-1 h-4 w-4' />
                          No ({item.notHelpfulCount})
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {displayItems.length === 0 && (
            <div className='text-muted-foreground py-8 text-center'>
              No FAQs found. Try adjusting your search or category filter.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Modal */}
      {feedbackModal.isOpen && (
        <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle>Help us improve</CardTitle>
              <CardDescription>
                What information were you looking for?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='Please tell us what would have been helpful...'
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                rows={4}
              />
              <div className='mt-4 flex gap-2'>
                <Button
                  onClick={submitFeedback}
                  disabled={!feedbackText.trim()}
                >
                  Submit Feedback
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setFeedbackModal({ isOpen: false, faqId: null })
                    setFeedbackText('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Support */}
      <Card className='mt-8'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='mb-1 text-lg font-semibold'>
                Can't find what you're looking for?
              </h3>
              <p className='text-muted-foreground'>
                Our support team is here to help
              </p>
            </div>
            <Button asChild>
              <a href='/support'>
                Contact Support
                <ChevronRight className='ml-1 h-4 w-4' />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
