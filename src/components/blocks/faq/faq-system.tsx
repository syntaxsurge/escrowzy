'use client'

import { useState, useEffect } from 'react'

import {
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Sparkles,
  HelpCircle
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib'

interface FaqCategory {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  itemCount?: number
}

interface FaqItem {
  id: number
  categoryId: number
  question: string
  answer: string
  slug: string
  tags?: string[]
  viewCount: number
  helpfulCount: number
  notHelpfulCount: number
  isHighlighted?: boolean
  category?: FaqCategory
}

interface FaqSystemProps {
  className?: string
  showSearch?: boolean
  showCategories?: boolean
  showPopular?: boolean
  categorySlug?: string
  limit?: number
}

export function FaqSystem({
  className,
  showSearch = true,
  showCategories = true,
  showPopular = true,
  categorySlug,
  limit = 20
}: FaqSystemProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categorySlug || null
  )
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [popularFaqs, setPopularFaqs] = useState<FaqItem[]>([])
  const [highlightedFaqs, setHighlightedFaqs] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<FaqItem[]>([])
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [feedbackDialog, setFeedbackDialog] = useState<{
    faqId: number
    isHelpful: boolean
  } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const { toast } = useToast()

  // Fetch categories
  useEffect(() => {
    fetchCategories()
    fetchHighlightedFaqs()
    if (showPopular) {
      fetchPopularFaqs()
    }
  }, [])

  // Fetch FAQs when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchFaqsByCategory(selectedCategory)
    }
  }, [selectedCategory])

  // Search FAQs
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        searchFaqs(searchQuery)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/faq/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch FAQ categories:', error)
    }
  }

  const fetchFaqsByCategory = async (slug: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/faq/category/${slug}`)
      const data = await response.json()
      setFaqs(data)
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPopularFaqs = async () => {
    try {
      const response = await fetch('/api/faq/popular')
      const data = await response.json()
      setPopularFaqs(data)
    } catch (error) {
      console.error('Failed to fetch popular FAQs:', error)
    }
  }

  const fetchHighlightedFaqs = async () => {
    try {
      const response = await fetch('/api/faq/highlighted')
      const data = await response.json()
      setHighlightedFaqs(data)
    } catch (error) {
      console.error('Failed to fetch highlighted FAQs:', error)
    }
  }

  const searchFaqs = async (query: string) => {
    try {
      const response = await fetch(
        `/api/faq/search?q=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Failed to search FAQs:', error)
    }
  }

  const handleVote = async (faqId: number, isHelpful: boolean) => {
    try {
      const response = await fetch('/api/faq/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqId, isHelpful })
      })

      if (response.ok) {
        toast({
          title: 'Thank you for your feedback!',
          description: 'Your vote has been recorded.'
        })

        // Update local state
        const updateFaq = (faq: FaqItem) => {
          if (faq.id === faqId) {
            return {
              ...faq,
              helpfulCount: isHelpful ? faq.helpfulCount + 1 : faq.helpfulCount,
              notHelpfulCount: !isHelpful
                ? faq.notHelpfulCount + 1
                : faq.notHelpfulCount
            }
          }
          return faq
        }

        setFaqs(faqs.map(updateFaq))
        setSearchResults(searchResults.map(updateFaq))
        setPopularFaqs(popularFaqs.map(updateFaq))
        setHighlightedFaqs(highlightedFaqs.map(updateFaq))
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      toast({
        title: 'Error',
        description: 'Failed to record your vote. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackDialog) return

    try {
      const response = await fetch('/api/faq/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faqId: feedbackDialog.faqId,
          isHelpful: feedbackDialog.isHelpful,
          feedback: feedbackText
        })
      })

      if (response.ok) {
        toast({
          title: 'Feedback submitted',
          description: 'Thank you for helping us improve our FAQ.'
        })
        setFeedbackDialog(null)
        setFeedbackText('')
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const displayFaqs = searchQuery.length > 2 ? searchResults : faqs

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Bar */}
      {showSearch && (
        <Card>
          <CardContent className='pt-6'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder='Search FAQs...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            {searchResults.length > 0 && searchQuery.length > 2 && (
              <div className='text-muted-foreground mt-2 text-sm'>
                Found {searchResults.length} result
                {searchResults.length !== 1 ? 's' : ''}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Highlighted FAQs */}
      {highlightedFaqs.length > 0 && (
        <Card className='border-primary/50 bg-primary/5'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Sparkles className='text-primary h-5 w-5' />
              Frequently Asked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type='single' collapsible className='w-full'>
              {highlightedFaqs.map(faq => (
                <AccordionItem key={faq.id} value={`highlighted-${faq.id}`}>
                  <AccordionTrigger className='text-left'>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='space-y-4'>
                      <div
                        className='prose prose-sm dark:prose-invert max-w-none'
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                      <FaqActions
                        faq={faq}
                        onVote={handleVote}
                        onFeedback={isHelpful =>
                          setFeedbackDialog({ faqId: faq.id, isHelpful })
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        {/* Categories Sidebar */}
        {showCategories && (
          <div className='lg:col-span-1'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Categories</CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='space-y-1'>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className={cn(
                        'hover:bg-muted w-full px-4 py-2 text-left transition-colors',
                        'flex items-center justify-between',
                        selectedCategory === category.slug && 'bg-muted'
                      )}
                    >
                      <span className='text-sm'>{category.name}</span>
                      {category.itemCount && (
                        <Badge variant='secondary' className='text-xs'>
                          {category.itemCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular FAQs */}
            {showPopular && popularFaqs.length > 0 && (
              <Card className='mt-6'>
                <CardHeader>
                  <CardTitle className='text-lg'>Most Viewed</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {popularFaqs.slice(0, 5).map(faq => (
                    <button
                      key={faq.id}
                      onClick={() => setExpandedFaq(faq.id)}
                      className='hover:text-primary text-left transition-colors'
                    >
                      <p className='line-clamp-2 text-sm'>{faq.question}</p>
                      <div className='text-muted-foreground mt-1 flex items-center gap-3 text-xs'>
                        <span className='flex items-center gap-1'>
                          <Eye className='h-3 w-3' />
                          {faq.viewCount}
                        </span>
                        <span className='flex items-center gap-1'>
                          <ThumbsUp className='h-3 w-3' />
                          {faq.helpfulCount}
                        </span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* FAQ List */}
        <div className={cn(showCategories ? 'lg:col-span-3' : 'lg:col-span-4')}>
          {loading ? (
            <FaqSkeleton />
          ) : displayFaqs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {searchQuery.length > 2
                    ? 'Search Results'
                    : selectedCategory
                      ? categories.find(c => c.slug === selectedCategory)?.name
                      : 'All FAQs'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type='single' collapsible className='w-full'>
                  {displayFaqs.map(faq => (
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                      <AccordionTrigger className='text-left'>
                        <div className='flex-1'>
                          <div>{faq.question}</div>
                          {faq.tags && faq.tags.length > 0 && (
                            <div className='mt-2 flex gap-1'>
                              {faq.tags.map(tag => (
                                <Badge
                                  key={tag}
                                  variant='outline'
                                  className='text-xs'
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className='space-y-4'>
                          <div
                            className='prose prose-sm dark:prose-invert max-w-none'
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
                          <FaqActions
                            faq={faq}
                            onVote={handleVote}
                            onFeedback={isHelpful =>
                              setFeedbackDialog({ faqId: faq.id, isHelpful })
                            }
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='py-12 text-center'>
                <HelpCircle className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>
                  {searchQuery.length > 2
                    ? 'No FAQs found matching your search.'
                    : 'Select a category to view FAQs.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog
        open={!!feedbackDialog}
        onOpenChange={() => setFeedbackDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Additional Feedback</DialogTitle>
            <DialogDescription>
              Help us improve this answer by providing more details.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Tell us more about why this was or wasn't helpful..."
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            rows={4}
          />
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setFeedbackDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// FAQ Actions Component
function FaqActions({
  faq,
  onVote,
  onFeedback
}: {
  faq: FaqItem
  onVote: (id: number, isHelpful: boolean) => void
  onFeedback: (isHelpful: boolean) => void
}) {
  const helpfulPercentage =
    faq.helpfulCount + faq.notHelpfulCount > 0
      ? Math.round(
          (faq.helpfulCount / (faq.helpfulCount + faq.notHelpfulCount)) * 100
        )
      : 0

  return (
    <div className='flex items-center justify-between border-t pt-4'>
      <div className='flex items-center gap-4'>
        <span className='text-muted-foreground text-sm'>Was this helpful?</span>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onVote(faq.id, true)}
            className='gap-1'
          >
            <ThumbsUp className='h-3 w-3' />
            {faq.helpfulCount > 0 && faq.helpfulCount}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onVote(faq.id, false)}
            className='gap-1'
          >
            <ThumbsDown className='h-3 w-3' />
            {faq.notHelpfulCount > 0 && faq.notHelpfulCount}
          </Button>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        {helpfulPercentage > 0 && (
          <span className='text-muted-foreground text-xs'>
            {helpfulPercentage}% found this helpful
          </span>
        )}
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onFeedback(false)}
          className='gap-1'
        >
          <MessageSquare className='h-3 w-3' />
          Feedback
        </Button>
      </div>
    </div>
  )
}

// FAQ Skeleton Loader
function FaqSkeleton() {
  return (
    <Card>
      <CardContent className='space-y-4 pt-6'>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className='space-y-2'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
