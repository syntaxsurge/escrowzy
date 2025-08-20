'use client'

import { useState } from 'react'

import {
  BookOpen,
  ChevronDown,
  Clock,
  Copy,
  DollarSign,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils/cn'

interface JobTemplatesProps {
  freelancerId: number
  onSelectTemplate?: (template: ProposalTemplate) => void
  selectionMode?: boolean
}

interface ProposalTemplate {
  id: string
  name: string
  description?: string
  category: string
  content: string
  deliveryTimeDays: number
  priceRange?: {
    min: number
    max: number
  }
  skills: string[]
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

interface TemplateStats {
  totalTemplates: number
  totalUsage: number
  categories: number
  mostUsed: string | null
}

const TEMPLATE_CATEGORIES = [
  { value: 'web-development', label: 'Web Development', icon: '💻' },
  { value: 'mobile-development', label: 'Mobile Development', icon: '📱' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'writing', label: 'Writing', icon: '✍️' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
  { value: 'consulting', label: 'Consulting', icon: '💼' },
  { value: 'other', label: 'Other', icon: '📋' }
]

export function JobTemplates({
  freelancerId,
  onSelectTemplate,
  selectionMode = false
}: JobTemplatesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProposalTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'web-development',
    content: '',
    deliveryTimeDays: 7,
    priceMin: 0,
    priceMax: 0,
    skills: ''
  })

  const { data, isLoading, mutate } = useSWR(
    `/api/freelancers/${freelancerId}/templates`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? response.data : { templates: [], stats: {} }
    }
  )

  const templates: ProposalTemplate[] = data?.templates || []
  const stats: TemplateStats = data?.stats || {}

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.content || !formData.deliveryTimeDays) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await api.post(
        `/api/freelancers/${freelancerId}/templates`,
        {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          content: formData.content,
          deliveryTimeDays: formData.deliveryTimeDays,
          priceRange:
            formData.priceMin || formData.priceMax
              ? {
                  min: formData.priceMin,
                  max: formData.priceMax
                }
              : undefined,
          skills: formData.skills
            ? formData.skills.split(',').map(s => s.trim())
            : []
        }
      )

      if (response.success) {
        toast.success('Template created successfully')
        setIsCreateDialogOpen(false)
        setFormData({
          name: '',
          description: '',
          category: 'web-development',
          content: '',
          deliveryTimeDays: 7,
          priceMin: 0,
          priceMax: 0,
          skills: ''
        })
        mutate()
      } else {
        toast.error(response.error || 'Failed to create template')
      }
    } catch (error) {
      toast.error('Failed to create template')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const response = await api.put(
        `/api/freelancers/${freelancerId}/templates`,
        {
          templateId: selectedTemplate.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          content: formData.content,
          deliveryTimeDays: formData.deliveryTimeDays,
          priceRange:
            formData.priceMin || formData.priceMax
              ? {
                  min: formData.priceMin,
                  max: formData.priceMax
                }
              : undefined,
          skills: formData.skills
            ? formData.skills.split(',').map(s => s.trim())
            : []
        }
      )

      if (response.success) {
        toast.success('Template updated successfully')
        setIsEditDialogOpen(false)
        setSelectedTemplate(null)
        mutate()
      } else {
        toast.error(response.error || 'Failed to update template')
      }
    } catch (error) {
      toast.error('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await api.delete(
        `/api/freelancers/${freelancerId}/templates?templateId=${templateId}`
      )

      if (response.success) {
        toast.success('Template deleted successfully')
        mutate()
      } else {
        toast.error(response.error || 'Failed to delete template')
      }
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const handleDuplicateTemplate = async (template: ProposalTemplate) => {
    try {
      const response = await api.post(
        `/api/freelancers/${freelancerId}/templates`,
        {
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          content: template.content,
          deliveryTimeDays: template.deliveryTimeDays,
          priceRange: template.priceRange,
          skills: template.skills
        }
      )

      if (response.success) {
        toast.success('Template duplicated successfully')
        mutate()
      } else {
        toast.error(response.error || 'Failed to duplicate template')
      }
    } catch (error) {
      toast.error('Failed to duplicate template')
    }
  }

  const openEditDialog = (template: ProposalTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      content: template.content,
      deliveryTimeDays: template.deliveryTimeDays,
      priceMin: template.priceRange?.min || 0,
      priceMax: template.priceRange?.max || 0,
      skills: template.skills.join(', ')
    })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex min-h-[400px] items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='text-primary mx-auto mb-4 h-8 w-8 animate-spin' />
            <p className='text-muted-foreground'>Loading templates...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Stats Cards */}
      {!selectionMode && (
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Templates
              </CardTitle>
              <FileText className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalTemplates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Usage</CardTitle>
              <TrendingUp className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalUsage}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Categories</CardTitle>
              <Tag className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.categories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Most Used</CardTitle>
              <BookOpen className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='truncate text-sm font-medium'>
                {stats.mostUsed || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              {selectionMode ? 'Select a Template' : 'Proposal Templates'}
            </span>
            {!selectionMode && (
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size='sm'>
                    <Plus className='mr-2 h-4 w-4' />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-2xl'>
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                      Create a reusable proposal template for faster bidding
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Template Name *</Label>
                        <Input
                          id='name'
                          value={formData.name}
                          onChange={e =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder='e.g., Web Development Proposal'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='category'>Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={value =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger id='category'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='description'>Description</Label>
                      <Input
                        id='description'
                        value={formData.description}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            description: e.target.value
                          })
                        }
                        placeholder='Brief description of this template'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='content'>Proposal Content *</Label>
                      <Textarea
                        id='content'
                        value={formData.content}
                        onChange={e =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder='Write your proposal template here...'
                        rows={8}
                      />
                    </div>

                    <div className='grid gap-4 sm:grid-cols-3'>
                      <div className='space-y-2'>
                        <Label htmlFor='deliveryTime'>
                          Delivery Time (days) *
                        </Label>
                        <Input
                          id='deliveryTime'
                          type='number'
                          value={formData.deliveryTimeDays}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              deliveryTimeDays: Number(e.target.value)
                            })
                          }
                          min={1}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='priceMin'>Min Price ($)</Label>
                        <Input
                          id='priceMin'
                          type='number'
                          value={formData.priceMin || ''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              priceMin: Number(e.target.value)
                            })
                          }
                          min={0}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='priceMax'>Max Price ($)</Label>
                        <Input
                          id='priceMax'
                          type='number'
                          value={formData.priceMax || ''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              priceMax: Number(e.target.value)
                            })
                          }
                          min={0}
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='skills'>Skills (comma-separated)</Label>
                      <Input
                        id='skills'
                        value={formData.skills}
                        onChange={e =>
                          setFormData({ ...formData, skills: e.target.value })
                        }
                        placeholder='e.g., React, Node.js, TypeScript'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate}>
                      Create Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className='mb-6 flex flex-col gap-3 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search templates...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className='w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className='grid gap-4 md:grid-cols-2'>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => {
                const category = TEMPLATE_CATEGORIES.find(
                  c => c.value === template.category
                )

                return (
                  <div
                    key={template.id}
                    className={cn(
                      'rounded-lg border p-4 transition-all',
                      selectionMode
                        ? 'hover:border-primary cursor-pointer hover:shadow-md'
                        : 'hover:shadow-sm'
                    )}
                    onClick={() =>
                      selectionMode && onSelectTemplate?.(template)
                    }
                  >
                    <div className='mb-3 flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3 className='font-semibold'>{template.name}</h3>
                        {template.description && (
                          <p className='text-muted-foreground text-sm'>
                            {template.description}
                          </p>
                        )}
                      </div>
                      {!selectionMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <ChevronDown className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(template)}
                            >
                              <Edit2 className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateTemplate(template)}
                            >
                              <Copy className='mr-2 h-4 w-4' />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template.id)}
                              className='text-red-600'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className='mb-3'>
                      <p className='text-muted-foreground line-clamp-3 text-sm'>
                        {template.content}
                      </p>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant='outline' className='text-xs'>
                        {category?.icon} {category?.label}
                      </Badge>
                      <Badge variant='outline' className='text-xs'>
                        <Clock className='mr-1 h-3 w-3' />
                        {template.deliveryTimeDays} days
                      </Badge>
                      {template.priceRange && (
                        <Badge variant='outline' className='text-xs'>
                          <DollarSign className='mr-1 h-3 w-3' />$
                          {template.priceRange.min} - ${template.priceRange.max}
                        </Badge>
                      )}
                      <Badge variant='outline' className='text-xs'>
                        Used {template.usageCount}x
                      </Badge>
                    </div>

                    {template.skills.length > 0 && (
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {template.skills.map(skill => (
                          <Badge
                            key={skill}
                            variant='secondary'
                            className='text-xs'
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className='col-span-2 py-12 text-center'>
                <BookOpen className='text-muted-foreground mx-auto mb-3 h-10 w-10' />
                <p className='text-muted-foreground mb-1 text-sm'>
                  No templates found
                </p>
                <p className='text-muted-foreground text-xs'>
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first proposal template to save time'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update your proposal template</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='edit-name'>Template Name *</Label>
                <Input
                  id='edit-name'
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-category'>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={value =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id='edit-category'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-description'>Description</Label>
              <Input
                id='edit-description'
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-content'>Proposal Content *</Label>
              <Textarea
                id='edit-content'
                value={formData.content}
                onChange={e =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='edit-deliveryTime'>
                  Delivery Time (days) *
                </Label>
                <Input
                  id='edit-deliveryTime'
                  type='number'
                  value={formData.deliveryTimeDays}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      deliveryTimeDays: Number(e.target.value)
                    })
                  }
                  min={1}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-priceMin'>Min Price ($)</Label>
                <Input
                  id='edit-priceMin'
                  type='number'
                  value={formData.priceMin || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      priceMin: Number(e.target.value)
                    })
                  }
                  min={0}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-priceMax'>Max Price ($)</Label>
                <Input
                  id='edit-priceMax'
                  type='number'
                  value={formData.priceMax || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      priceMax: Number(e.target.value)
                    })
                  }
                  min={0}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-skills'>Skills (comma-separated)</Label>
              <Input
                id='edit-skills'
                value={formData.skills}
                onChange={e =>
                  setFormData({ ...formData, skills: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>Update Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
