'use client'

import { useState, useEffect } from 'react'

import {
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle,
  Lock,
  Search,
  Trophy,
  ChevronRight,
  Sparkles
} from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Tutorial {
  id: number
  key: string
  title: string
  description: string
  type: 'interactive' | 'video'
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  xpReward: number
  prerequisites: string[]
  completed?: boolean
  progress?: number
  locked?: boolean
}

interface TutorialProgress {
  tutorialId: number
  completed: boolean
  completedAt: Date | null
  progress: number
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [userProgress, setUserProgress] = useState<
    Map<number, TutorialProgress>
  >(new Map())
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTutorials()
    fetchUserProgress()
  }, [])

  const fetchTutorials = async () => {
    try {
      const response = await fetch('/api/tutorials')
      const data = await response.json()
      setTutorials(data)
    } catch (error) {
      console.error('Failed to fetch tutorials:', error)
      toast.error('Failed to load tutorials')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/tutorials/progress')
      if (response.ok) {
        const data = await response.json()
        const progressMap = new Map()
        data.forEach((p: TutorialProgress) => {
          progressMap.set(p.tutorialId, p)
        })
        setUserProgress(progressMap)
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    }
  }

  const startTutorial = async (tutorial: Tutorial) => {
    if (tutorial.locked) {
      toast.error('Complete the prerequisites first!')
      return
    }

    if (tutorial.type === 'interactive') {
      // Start interactive tutorial with intro.js or similar
      toast.success(`Starting ${tutorial.title}...`)
      // Implementation would integrate with intro.js here
    } else {
      // Open video tutorial
      toast.success(`Opening ${tutorial.title}...`)
      // Implementation would open video player
    }
  }

  const completeTutorial = async (tutorialId: number) => {
    try {
      const response = await fetch('/api/tutorials/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(
          `Tutorial completed! +${data.progress.xpEarned} XP earned!`
        )

        // Update local progress
        setUserProgress(prev => {
          const newMap = new Map(prev)
          newMap.set(tutorialId, data.progress)
          return newMap
        })
      }
    } catch (error) {
      console.error('Failed to complete tutorial:', error)
      toast.error('Failed to mark tutorial as complete')
    }
  }

  // Filter tutorials
  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory =
      selectedCategory === 'all' || tutorial.category === selectedCategory
    const matchesDifficulty =
      selectedDifficulty === 'all' || tutorial.difficulty === selectedDifficulty
    const matchesSearch =
      !searchQuery ||
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesDifficulty && matchesSearch
  })

  // Group tutorials by category
  const categories = [
    'all',
    ...Array.from(new Set(tutorials.map(t => t.category)))
  ]

  // Calculate stats
  const completedCount = Array.from(userProgress.values()).filter(
    p => p.completed
  ).length
  const totalXpEarned = Array.from(userProgress.values())
    .filter(p => p.completed)
    .reduce((sum, p) => {
      const tutorial = tutorials.find(t => t.id === p.tutorialId)
      return sum + (tutorial?.xpReward || 0)
    }, 0)

  const difficultyColors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500'
  }

  const difficultyIcons = {
    beginner: '🌱',
    intermediate: '🌟',
    advanced: '🔥'
  }

  return (
    <div className='container mx-auto max-w-7xl px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='mb-4 text-4xl font-bold'>Tutorials & Guides</h1>
        <p className='text-muted-foreground text-xl'>
          Learn how to use Escrowzy with interactive tutorials and video guides
        </p>
      </div>

      {/* Stats Cards */}
      <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Completed</p>
                <p className='text-2xl font-bold'>
                  {completedCount}/{tutorials.length}
                </p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-500' />
            </div>
            <Progress
              value={(completedCount / tutorials.length) * 100}
              className='mt-3'
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>XP Earned</p>
                <p className='text-2xl font-bold'>{totalXpEarned}</p>
              </div>
              <Trophy className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-muted-foreground text-sm'>Next Reward</p>
                <p className='text-2xl font-bold'>500 XP</p>
              </div>
              <Sparkles className='h-8 w-8 text-purple-500' />
            </div>
            <p className='text-muted-foreground mt-2 text-xs'>
              Complete 5 more tutorials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <div className='flex flex-col gap-4 md:flex-row'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  type='search'
                  placeholder='Search tutorials...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat === 'all'
                      ? 'All'
                      : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Tabs
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <TabsList>
                <TabsTrigger value='all'>All Levels</TabsTrigger>
                <TabsTrigger value='beginner'>Beginner</TabsTrigger>
                <TabsTrigger value='intermediate'>Intermediate</TabsTrigger>
                <TabsTrigger value='advanced'>Advanced</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Tutorials Grid */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {filteredTutorials.map(tutorial => {
          const progress = userProgress.get(tutorial.id)
          const isCompleted = progress?.completed || false
          const isLocked =
            tutorial.prerequisites.length > 0 &&
            !tutorial.prerequisites.every(prereq => {
              const prereqTutorial = tutorials.find(t => t.key === prereq)
              return (
                prereqTutorial && userProgress.get(prereqTutorial.id)?.completed
              )
            })

          return (
            <Card
              key={tutorial.id}
              className={`relative ${isLocked ? 'opacity-60' : ''} transition-shadow hover:shadow-lg`}
            >
              {isCompleted && (
                <div className='absolute top-4 right-4 z-10'>
                  <CheckCircle className='h-6 w-6 text-green-500' />
                </div>
              )}

              <CardHeader>
                <div className='mb-2 flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    {tutorial.type === 'video' ? (
                      <PlayCircle className='h-5 w-5 text-blue-500' />
                    ) : (
                      <BookOpen className='h-5 w-5 text-purple-500' />
                    )}
                    <Badge variant='outline'>
                      {tutorial.type === 'video' ? 'Video' : 'Interactive'}
                    </Badge>
                  </div>
                  <Badge className={difficultyColors[tutorial.difficulty]}>
                    {difficultyIcons[tutorial.difficulty]} {tutorial.difficulty}
                  </Badge>
                </div>

                <CardTitle className='text-lg'>{tutorial.title}</CardTitle>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <div className='text-muted-foreground flex items-center gap-1'>
                      <Clock className='h-4 w-4' />
                      <span>{tutorial.estimatedTime} min</span>
                    </div>
                    <div className='flex items-center gap-1 text-yellow-600'>
                      <Trophy className='h-4 w-4' />
                      <span>+{tutorial.xpReward} XP</span>
                    </div>
                  </div>

                  {progress && !isCompleted && (
                    <div>
                      <div className='mb-1 flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>Progress</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <Progress value={progress.progress} />
                    </div>
                  )}

                  {tutorial.prerequisites.length > 0 && (
                    <div className='text-muted-foreground text-xs'>
                      Prerequisites: {tutorial.prerequisites.join(', ')}
                    </div>
                  )}

                  <Button
                    className='w-full'
                    variant={isCompleted ? 'outline' : 'default'}
                    disabled={isLocked}
                    onClick={() => startTutorial(tutorial)}
                  >
                    {isLocked && <Lock className='mr-2 h-4 w-4' />}
                    {isCompleted
                      ? 'Review'
                      : isLocked
                        ? 'Locked'
                        : 'Start Tutorial'}
                    {!isLocked && !isCompleted && (
                      <ChevronRight className='ml-2 h-4 w-4' />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTutorials.length === 0 && (
        <Card>
          <CardContent className='p-12 text-center'>
            <p className='text-muted-foreground'>
              No tutorials found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommended Path */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Recommended Learning Path</CardTitle>
          <CardDescription>
            Follow this path for the best learning experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {[
              'Getting Started with Escrowzy',
              'Creating Your First Escrow',
              'Understanding Fees',
              'Advanced Trading'
            ].map((title, index) => (
              <div key={index} className='flex items-center gap-3'>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                    index < 2 ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                >
                  {index < 2 ? '✓' : index + 1}
                </div>
                <span
                  className={
                    index < 2 ? 'text-muted-foreground line-through' : ''
                  }
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
