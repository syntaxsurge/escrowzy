'use client'

import { useState, useEffect } from 'react'

import { Shield, Star, Users, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  EndorsementWithDetails,
  SkillEndorsementStats
} from '@/lib/db/queries/skill-endorsements'

import { SkillEndorsementCard } from './skill-endorsement-card'

interface SkillEndorsementsListProps {
  userId: number
  initialEndorsements?: EndorsementWithDetails[]
  initialStats?: SkillEndorsementStats[]
}

export function SkillEndorsementsList({
  userId,
  initialEndorsements = [],
  initialStats = []
}: SkillEndorsementsListProps) {
  const [endorsements, setEndorsements] = useState(initialEndorsements)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(!initialEndorsements.length)
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null)

  useEffect(() => {
    if (!initialEndorsements.length) {
      fetchEndorsements()
    }
  }, [userId])

  const fetchEndorsements = async () => {
    try {
      const response = await fetch(`/api/endorsements?userId=${userId}`)
      const data = await response.json()

      if (response.ok) {
        setEndorsements(data.endorsements || [])
        setStats(data.stats || [])
      }
    } catch (error) {
      console.error('Error fetching endorsements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEndorsements = selectedSkill
    ? endorsements.filter(e => e.skill.id === selectedSkill)
    : endorsements

  const getSkillColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getSkillLevel = (avgRating: number) => {
    if (avgRating >= 4.5) return 'Expert'
    if (avgRating >= 4.0) return 'Advanced'
    if (avgRating >= 3.5) return 'Intermediate'
    if (avgRating >= 3.0) return 'Competent'
    return 'Beginner'
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Skills Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {stats.map(stat => (
          <Card
            key={stat.skillId}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSkill === stat.skillId ? 'ring-primary ring-2' : ''
            }`}
            onClick={() =>
              setSelectedSkill(
                selectedSkill === stat.skillId ? null : stat.skillId
              )
            }
          >
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base'>{stat.skillName}</CardTitle>
                <Badge
                  variant='secondary'
                  className={getSkillColor(stat.averageRating)}
                >
                  {getSkillLevel(stat.averageRating)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-1'>
                  <Star className='h-4 w-4 text-yellow-400' />
                  <span className='font-medium'>{stat.averageRating}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Users className='text-muted-foreground h-4 w-4' />
                  <span>{stat.uniqueEndorsers} endorsers</span>
                </div>
              </div>

              <div className='space-y-1'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>Endorsements</span>
                  <span className='font-medium'>{stat.totalEndorsements}</span>
                </div>
                <Progress
                  value={(stat.totalEndorsements / 50) * 100}
                  className='h-2'
                />
              </div>

              {stat.verifiedEndorsements > 0 && (
                <div className='text-muted-foreground flex items-center gap-1 text-xs'>
                  <Shield className='h-3 w-3' />
                  <span>{stat.verifiedEndorsements} verified</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Endorsements List */}
      {endorsements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Skill Endorsements
              {selectedSkill && (
                <Badge variant='outline'>
                  {stats.find(s => s.skillId === selectedSkill)?.skillName}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='all' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='all'>All Endorsements</TabsTrigger>
                <TabsTrigger value='verified'>Verified Only</TabsTrigger>
              </TabsList>
              <TabsContent value='all' className='space-y-4'>
                {filteredEndorsements.map(endorsement => (
                  <SkillEndorsementCard
                    key={endorsement.id}
                    endorsement={endorsement}
                  />
                ))}
              </TabsContent>
              <TabsContent value='verified' className='space-y-4'>
                {filteredEndorsements
                  .filter(e => e.verified)
                  .map(endorsement => (
                    <SkillEndorsementCard
                      key={endorsement.id}
                      endorsement={endorsement}
                    />
                  ))}
                {filteredEndorsements.filter(e => e.verified).length === 0 && (
                  <div className='text-muted-foreground py-8 text-center'>
                    No verified endorsements yet
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {endorsements.length === 0 && (
        <Card>
          <CardContent className='py-12 text-center'>
            <Users className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-medium'>No Endorsements Yet</h3>
            <p className='text-muted-foreground'>
              Skills endorsements from colleagues and clients will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
