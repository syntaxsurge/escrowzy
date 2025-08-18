'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  Plus,
  X,
  Users,
  Award,
  AlertCircle,
  Target,
  Sparkles,
  Shield
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { mutate } from 'swr'
import { z } from 'zod'

import { GamifiedHeader } from '@/components/blocks/trading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiEndpoints } from '@/config/api-endpoints'
import { appRoutes } from '@/config/app-routes'
import { useToast } from '@/hooks/use-toast'
import { handleFormSuccess } from '@/lib/utils/form'

// Job posting schema
const createJobSchema = z.object({
  postingType: z.enum(['job', 'service']), // job = client posts job, service = freelancer offers service
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  budgetType: z.enum(['fixed', 'hourly']),
  budget: z.string().optional(), // For services
  budgetMin: z.string().optional(), // For jobs - made optional
  budgetMax: z.string().optional(), // For jobs - made optional
  currency: z.string().default('USD'),
  deadline: z.string().optional(),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']),
  projectDuration: z.string().optional(),
  revisions: z.number().optional(), // Number of revisions for services
  skillsRequired: z.array(z.string()).min(1, 'At least one skill is required'),
  milestones: z
    .array(
      z.object({
        title: z.string().min(5, 'Milestone title is required'),
        description: z.string().optional(),
        amount: z.string().min(1, 'Amount is required'),
        dueDate: z.string().optional()
      })
    )
    .optional()
})

type JobFormData = z.infer<typeof createJobSchema>

export default function CreateServiceListingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [milestones, setMilestones] = useState<any[]>([])
  const [showMilestones, setShowMilestones] = useState(false)
  const [jobCategories, setJobCategories] = useState<any[]>([])
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<JobFormData>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      postingType: 'service',
      title: '',
      description: '',
      categoryId: '',
      budgetType: 'fixed',
      budget: '',
      budgetMin: '',
      budgetMax: '',
      currency: 'USD',
      experienceLevel: 'intermediate',
      projectDuration: '',
      revisions: 0,
      skillsRequired: [],
      milestones: []
    }
  })

  const budgetType = form.watch('budgetType')
  const postingType = form.watch('postingType')
  const selectedCategoryId = form.watch('categoryId')

  // Fetch categories and skills on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/jobs/categories')
        const categoriesData = await categoriesResponse.json()
        if (categoriesData.success) {
          setJobCategories(categoriesData.categories)
        }

        // Fetch all skills initially
        const skillsResponse = await fetch('/api/jobs/skills')
        const skillsData = await skillsResponse.json()
        if (skillsData.success) {
          setAvailableSkills(skillsData.skills.map((s: any) => s.name))
        }
      } catch (error) {
        console.error('Failed to fetch categories/skills:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update skills when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchCategorySkills = async () => {
        try {
          const response = await fetch(
            `/api/jobs/skills?categoryId=${selectedCategoryId}`
          )
          const data = await response.json()
          if (data.success) {
            setAvailableSkills(data.skills.map((s: any) => s.name))
          }
        } catch (error) {
          console.error('Failed to fetch category skills:', error)
        }
      }
      fetchCategorySkills()
    }
  }, [selectedCategoryId])

  // Filter skills based on search
  const filteredSkills = availableSkills.filter(
    skill =>
      skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !selectedSkills.includes(skill)
  )

  const addSkill = (skill: string) => {
    const newSkills = [...selectedSkills, skill]
    setSelectedSkills(newSkills)
    form.setValue('skillsRequired', newSkills)
    setSkillSearch('')
  }

  const removeSkill = (skill: string) => {
    const newSkills = selectedSkills.filter(s => s !== skill)
    setSelectedSkills(newSkills)
    form.setValue('skillsRequired', newSkills)
  }

  const addMilestone = () => {
    const newMilestone = {
      title: '',
      description: '',
      amount: '',
      dueDate: ''
    }
    setMilestones([...milestones, newMilestone])
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
    form.setValue('milestones', updated)
  }

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true)
    try {
      if (postingType === 'service') {
        // Create service listing
        const serviceData = {
          listingCategory: 'service',
          listingType: 'sell',
          serviceTitle: data.title,
          serviceDescription: data.description,
          serviceCategoryId: parseInt(selectedCategoryId) || 1, // Use selected category or default
          amount: (data.budget || data.budgetMin || '100').toString(),
          pricePerUnit:
            data.budgetType === 'hourly'
              ? (data.budget || data.budgetMin || '50').toString()
              : undefined,
          deliveryTime: parseInt(data.projectDuration || '7') || 7, // Default to 7 days if not specified
          revisions: data.revisions || 0,
          skillsOffered: data.skillsRequired || [],
          paymentMethods: ['bank_transfer', 'paypal', 'crypto'], // Default payment methods
          chainId: '1' // Default chain ID
        }

        const response = await fetch(apiEndpoints.listings.create, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to create service listing')
        }

        handleFormSuccess(
          toast,
          'Your service offer has been created successfully!'
        )
      } else {
        // TODO: Implement job posting creation
        handleFormSuccess(toast, 'Job posting feature coming soon!')
      }

      // Invalidate the listings cache to ensure new listing shows
      await mutate(apiEndpoints.listings.user)

      // Redirect to listings page
      router.push(appRoutes.trades.myListings)
    } catch (error) {
      console.error('Error submitting:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to create listing. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='container mx-auto max-w-4xl space-y-6 p-4'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2'></div>
            <p className='text-muted-foreground mt-4'>
              Loading categories and skills...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-6 p-4'>
      {/* Header */}
      <GamifiedHeader
        title='CREATE SERVICE LISTING'
        subtitle='Find talented freelancers or offer your professional services'
        icon={<Briefcase className='h-8 w-8 text-white' />}
        actions={
          <Button
            variant='outline'
            onClick={() => router.push(appRoutes.trades.listings.create)}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Options
          </Button>
        }
      />

      {/* Tips Section */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='group relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='from-primary rounded-lg bg-gradient-to-br to-purple-600 p-2'>
                <Target className='h-5 w-5 text-white' />
              </div>
              <div>
                <p className='text-xs font-bold text-purple-600 uppercase dark:text-purple-400'>
                  Pro Tip
                </p>
                <p className='text-sm'>
                  Clear requirements attract better proposals!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='group relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-2'>
                <Sparkles className='h-5 w-5 text-white' />
              </div>
              <div>
                <p className='text-xs font-bold text-blue-600 uppercase dark:text-blue-400'>
                  Achievement
                </p>
                <p className='text-sm'>
                  Complete your first project for rewards!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='group relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 p-2'>
                <Shield className='h-5 w-5 text-white' />
              </div>
              <div>
                <p className='text-xs font-bold text-green-600 uppercase dark:text-green-400'>
                  Secure
                </p>
                <p className='text-sm'>Milestone-based escrow protection!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Card */}
      <Card className='relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5' />

        <CardHeader className='relative'>
          <CardTitle className='bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-2xl font-black text-transparent'>
            Service Configuration
          </CardTitle>
        </CardHeader>

        <CardContent className='relative'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Posting Type */}
              <FormField
                control={form.control}
                name='postingType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What would you like to do?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className='grid grid-cols-2 gap-4'
                      >
                        <div className='relative'>
                          <RadioGroupItem
                            value='job'
                            id='job'
                            className='peer sr-only'
                          />
                          <Label
                            htmlFor='job'
                            className='border-muted hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4'
                          >
                            <Users className='mb-2 h-6 w-6' />
                            <span className='font-semibold'>Post a Job</span>
                            <span className='text-muted-foreground text-sm'>
                              I need to hire a freelancer
                            </span>
                          </Label>
                        </div>
                        <div className='relative'>
                          <RadioGroupItem
                            value='service'
                            id='service'
                            className='peer sr-only'
                          />
                          <Label
                            htmlFor='service'
                            className='border-muted hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4'
                          >
                            <Award className='mb-2 h-6 w-6' />
                            <span className='font-semibold'>Offer Service</span>
                            <span className='text-muted-foreground text-sm'>
                              I want to offer my services
                            </span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Basic Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>
                  {postingType === 'job' ? 'Job Details' : 'Service Details'}
                </h3>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            postingType === 'job'
                              ? 'e.g., Build a responsive e-commerce website'
                              : 'e.g., I will create a professional website for your business'
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Make it clear and descriptive
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='categoryId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a category' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobCategories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              <span className='flex items-center gap-2'>
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            postingType === 'job'
                              ? 'Describe what you need done, requirements, and deliverables...'
                              : 'Describe what services you offer, your process, and what clients can expect...'
                          }
                          className='min-h-[150px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum 50 characters. Be as detailed as possible.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Budget & Timeline */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Budget & Timeline</h3>
                <FormField
                  control={form.control}
                  name='budgetType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='fixed'>
                            <span className='flex items-center gap-2'>
                              <DollarSign className='h-4 w-4' />
                              Fixed Price
                            </span>
                          </SelectItem>
                          <SelectItem value='hourly'>
                            <span className='flex items-center gap-2'>
                              <Clock className='h-4 w-4' />
                              Hourly Rate
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='budgetMin'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {budgetType === 'hourly'
                            ? 'Min Hourly Rate'
                            : 'Minimum Budget'}
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <span className='absolute top-1/2 left-3 -translate-y-1/2'>
                              $
                            </span>
                            <Input
                              type='number'
                              placeholder='0'
                              className='pl-8'
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='budgetMax'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {budgetType === 'hourly'
                            ? 'Max Hourly Rate'
                            : 'Maximum Budget'}
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <span className='absolute top-1/2 left-3 -translate-y-1/2'>
                              $
                            </span>
                            <Input
                              type='number'
                              placeholder='0'
                              className='pl-8'
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='projectDuration'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Duration</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select duration' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='less_than_week'>
                            Less than a week
                          </SelectItem>
                          <SelectItem value='1_2_weeks'>1-2 weeks</SelectItem>
                          <SelectItem value='2_4_weeks'>2-4 weeks</SelectItem>
                          <SelectItem value='1_3_months'>1-3 months</SelectItem>
                          <SelectItem value='3_6_months'>3-6 months</SelectItem>
                          <SelectItem value='more_than_6_months'>
                            More than 6 months
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='deadline'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline (Optional)</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormDescription>
                        When do you need this completed?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Skills & Experience */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Skills & Experience</h3>
                <FormField
                  control={form.control}
                  name='experienceLevel'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='entry'>
                            <div>
                              <div className='font-medium'>Entry Level</div>
                              <div className='text-muted-foreground text-sm'>
                                Looking for beginners or students
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value='intermediate'>
                            <div>
                              <div className='font-medium'>Intermediate</div>
                              <div className='text-muted-foreground text-sm'>
                                Looking for experienced freelancers
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value='expert'>
                            <div>
                              <div className='font-medium'>Expert</div>
                              <div className='text-muted-foreground text-sm'>
                                Looking for top professionals
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='skillsRequired'
                  render={() => (
                    <FormItem>
                      <FormLabel>Required Skills</FormLabel>
                      <FormControl>
                        <div className='space-y-3'>
                          <Input
                            placeholder='Search and add skills...'
                            value={skillSearch}
                            onChange={e => setSkillSearch(e.target.value)}
                          />

                          {/* Selected Skills */}
                          {selectedSkills.length > 0 && (
                            <div className='flex flex-wrap gap-2'>
                              {selectedSkills.map(skill => (
                                <Badge
                                  key={skill}
                                  variant='secondary'
                                  className='cursor-pointer'
                                  onClick={() => removeSkill(skill)}
                                >
                                  {skill}
                                  <X className='ml-1 h-3 w-3' />
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Skill Suggestions */}
                          {skillSearch && filteredSkills.length > 0 && (
                            <div className='rounded-lg border p-2'>
                              <div className='text-muted-foreground mb-2 text-sm'>
                                Suggestions:
                              </div>
                              <div className='flex flex-wrap gap-2'>
                                {filteredSkills.slice(0, 10).map(skill => (
                                  <Badge
                                    key={skill}
                                    variant='outline'
                                    className='hover:bg-accent cursor-pointer'
                                    onClick={() => addSkill(skill)}
                                  >
                                    <Plus className='mr-1 h-3 w-3' />
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Add at least one required skill
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Milestones (Optional) */}
              {budgetType === 'fixed' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>
                      Milestones (Optional)
                    </h3>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setShowMilestones(!showMilestones)}
                    >
                      {showMilestones ? 'Hide' : 'Add'} Milestones
                    </Button>
                  </div>

                  {showMilestones && (
                    <div className='space-y-4'>
                      <Alert>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>
                          Break your project into milestones for better payment
                          management
                        </AlertDescription>
                      </Alert>

                      {milestones.map((milestone, index) => (
                        <div
                          key={index}
                          className='space-y-3 rounded-lg border p-4'
                        >
                          <div className='flex items-center justify-between'>
                            <Label>Milestone {index + 1}</Label>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => removeMilestone(index)}
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>

                          <Input
                            placeholder='Milestone title'
                            value={milestone.title}
                            onChange={e =>
                              updateMilestone(index, 'title', e.target.value)
                            }
                          />

                          <Textarea
                            placeholder='Milestone description (optional)'
                            value={milestone.description}
                            onChange={e =>
                              updateMilestone(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                          />

                          <div className='grid grid-cols-2 gap-3'>
                            <div className='relative'>
                              <span className='absolute top-1/2 left-3 -translate-y-1/2'>
                                $
                              </span>
                              <Input
                                type='number'
                                placeholder='Amount'
                                className='pl-8'
                                value={milestone.amount}
                                onChange={e =>
                                  updateMilestone(
                                    index,
                                    'amount',
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <Input
                              type='date'
                              placeholder='Due date'
                              value={milestone.dueDate}
                              onChange={e =>
                                updateMilestone(
                                  index,
                                  'dueDate',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        type='button'
                        variant='outline'
                        className='w-full'
                        onClick={addMilestone}
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Add Milestone
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className='border-primary/30 from-primary/10 relative rounded-xl border-2 bg-gradient-to-br to-purple-600/10 p-6'>
                <div className='bg-primary text-primary-foreground absolute top-0 left-0 flex -translate-y-1/2 items-center gap-2 rounded-full px-4 py-1 text-xs font-black'>
                  <ChevronRight className='h-3 w-3' />
                  FINAL STEP
                </div>
                <div className='flex justify-between gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='lg'
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className='border-2 font-bold'
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    type='submit'
                    size='lg'
                    isLoading={isSubmitting}
                    loadingText='Creating...'
                    className='bg-gradient-to-r from-green-600 to-emerald-700 font-bold text-white shadow-lg hover:from-green-700 hover:to-emerald-800'
                  >
                    <Briefcase className='mr-2 h-5 w-5' />
                    {postingType === 'job'
                      ? 'POST JOB'
                      : 'CREATE SERVICE OFFER'}
                  </LoadingButton>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
