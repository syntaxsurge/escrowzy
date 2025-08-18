'use client'

import { useState } from 'react'

import { Plus, X, Upload, Link, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PortfolioItem {
  id?: string
  title: string
  description: string
  projectUrl?: string
  images?: string[]
  skills?: string[]
  completionDate?: string
  clientName?: string
}

interface PortfolioUploadProps {
  portfolioItems: PortfolioItem[]
  onChange: (items: PortfolioItem[]) => void
  maxItems?: number
}

export function PortfolioUpload({
  portfolioItems,
  onChange,
  maxItems = 10
}: PortfolioUploadProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [currentItem, setCurrentItem] = useState<PortfolioItem>({
    title: '',
    description: '',
    projectUrl: '',
    skills: [],
    completionDate: '',
    clientName: ''
  })
  const [currentSkill, setCurrentSkill] = useState('')

  const handleAddItem = () => {
    if (!currentItem.title || !currentItem.description) {
      toast.error('Please provide at least a title and description')
      return
    }

    if (portfolioItems.length >= maxItems) {
      toast.error(`Maximum ${maxItems} portfolio items allowed`)
      return
    }

    const newItem = {
      ...currentItem,
      id: Date.now().toString()
    }

    onChange([...portfolioItems, newItem])

    // Reset form
    setCurrentItem({
      title: '',
      description: '',
      projectUrl: '',
      skills: [],
      completionDate: '',
      clientName: ''
    })
    setIsAdding(false)
    toast.success('Portfolio item added')
  }

  const handleRemoveItem = (index: number) => {
    onChange(portfolioItems.filter((_, i) => i !== index))
    toast.success('Portfolio item removed')
  }

  const handleAddSkill = () => {
    if (!currentSkill || currentItem.skills?.includes(currentSkill)) {
      return
    }

    setCurrentItem({
      ...currentItem,
      skills: [...(currentItem.skills || []), currentSkill]
    })
    setCurrentSkill('')
  }

  const handleRemoveSkill = (skill: string) => {
    setCurrentItem({
      ...currentItem,
      skills: currentItem.skills?.filter(s => s !== skill) || []
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // In production, you would upload these to a storage service
    // For now, we'll just show a placeholder message
    const fileNames = Array.from(files).map(f => f.name)
    toast.info(`Images selected: ${fileNames.join(', ')}`)

    // Mock image URLs for demonstration
    const mockUrls = fileNames.map((_, i) => `/placeholder-${i + 1}.jpg`)
    setCurrentItem({
      ...currentItem,
      images: [...(currentItem.images || []), ...mockUrls]
    })
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label>Portfolio Items</Label>
        <span className='text-muted-foreground text-sm'>
          {portfolioItems.length}/{maxItems}
        </span>
      </div>

      {/* Existing Portfolio Items */}
      {portfolioItems.length > 0 && (
        <div className='grid gap-4 md:grid-cols-2'>
          {portfolioItems.map((item, index) => (
            <Card key={item.id || index}>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-1'>
                    <CardTitle className='text-base'>{item.title}</CardTitle>
                    {item.clientName && (
                      <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                        <User className='h-3 w-3' />
                        {item.clientName}
                      </p>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemoveItem(index)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-2'>
                <p className='text-muted-foreground line-clamp-2 text-sm'>
                  {item.description}
                </p>

                {item.skills && item.skills.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {item.skills.slice(0, 3).map(skill => (
                      <Badge
                        key={skill}
                        variant='secondary'
                        className='text-xs'
                      >
                        {skill}
                      </Badge>
                    ))}
                    {item.skills.length > 3 && (
                      <Badge variant='outline' className='text-xs'>
                        +{item.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className='text-muted-foreground flex items-center gap-3 text-xs'>
                  {item.projectUrl && (
                    <span className='flex items-center gap-1'>
                      <Link className='h-3 w-3' />
                      Link
                    </span>
                  )}
                  {item.completionDate && (
                    <span className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      {new Date(item.completionDate).toLocaleDateString()}
                    </span>
                  )}
                  {item.images && item.images.length > 0 && (
                    <span>{item.images.length} images</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Portfolio Item Form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Portfolio Item</CardTitle>
            <CardDescription>
              Showcase your best work to potential clients
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Project Title *</Label>
              <Input
                id='title'
                placeholder='E.g., E-commerce Website Redesign'
                value={currentItem.title}
                onChange={e =>
                  setCurrentItem({ ...currentItem, title: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description *</Label>
              <Textarea
                id='description'
                placeholder='Describe the project, your role, and the outcome...'
                rows={4}
                value={currentItem.description}
                onChange={e =>
                  setCurrentItem({
                    ...currentItem,
                    description: e.target.value
                  })
                }
              />
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='projectUrl'>Project URL</Label>
                <Input
                  id='projectUrl'
                  type='url'
                  placeholder='https://example.com'
                  value={currentItem.projectUrl}
                  onChange={e =>
                    setCurrentItem({
                      ...currentItem,
                      projectUrl: e.target.value
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='clientName'>Client Name</Label>
                <Input
                  id='clientName'
                  placeholder='Company or individual'
                  value={currentItem.clientName}
                  onChange={e =>
                    setCurrentItem({
                      ...currentItem,
                      clientName: e.target.value
                    })
                  }
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='completionDate'>Completion Date</Label>
              <Input
                id='completionDate'
                type='date'
                value={currentItem.completionDate}
                onChange={e =>
                  setCurrentItem({
                    ...currentItem,
                    completionDate: e.target.value
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label>Skills Used</Label>
              <div className='flex gap-2'>
                <Input
                  placeholder='Add a skill'
                  value={currentSkill}
                  onChange={e => setCurrentSkill(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSkill()
                    }
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleAddSkill}
                  disabled={!currentSkill}
                >
                  Add
                </Button>
              </div>
              {currentItem.skills && currentItem.skills.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-1'>
                  {currentItem.skills.map(skill => (
                    <Badge key={skill} variant='secondary'>
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className='hover:text-destructive ml-1'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='images'>Project Images</Label>
              <div className='flex items-center gap-2'>
                <Input
                  id='images'
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={handleImageUpload}
                  className='flex-1'
                />
                <Upload className='text-muted-foreground h-4 w-4' />
              </div>
              <p className='text-muted-foreground text-xs'>
                Upload images showcasing your work (max 5 per project)
              </p>
            </div>

            <div className='flex gap-2'>
              <Button onClick={handleAddItem}>Add Portfolio Item</Button>
              <Button
                variant='outline'
                onClick={() => {
                  setIsAdding(false)
                  setCurrentItem({
                    title: '',
                    description: '',
                    projectUrl: '',
                    skills: [],
                    completionDate: '',
                    clientName: ''
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        portfolioItems.length < maxItems && (
          <Button
            variant='outline'
            className='w-full'
            onClick={() => setIsAdding(true)}
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Portfolio Item
          </Button>
        )
      )}
    </div>
  )
}
