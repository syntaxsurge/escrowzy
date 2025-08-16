'use client'

import { useState } from 'react'

import { ReviewList } from '@/components/blocks/reviews/review-list'
import { ReviewStatsComponent } from '@/components/blocks/reviews/review-stats'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'

export default function ManageReviewsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('received')

  if (!user) {
    return null
  }

  return (
    <div className='container max-w-6xl py-8'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Manage Reviews</h1>
          <p className='text-muted-foreground'>View and manage your reviews</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='received'>Reviews About You</TabsTrigger>
            <TabsTrigger value='given'>Reviews You Wrote</TabsTrigger>
            <TabsTrigger value='stats'>Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value='received' className='space-y-6'>
            <div className='grid gap-6'>
              <div>
                <h2 className='mb-4 text-xl font-semibold'>As a Freelancer</h2>
                <ReviewList userId={user.id} type='freelancer' />
              </div>
              <div>
                <h2 className='mb-4 text-xl font-semibold'>As a Client</h2>
                <ReviewList userId={user.id} type='client' />
              </div>
            </div>
          </TabsContent>

          <TabsContent value='given' className='space-y-6'>
            <p className='text-muted-foreground'>
              This section will show reviews you have written for others.
            </p>
          </TabsContent>

          <TabsContent value='stats' className='space-y-6'>
            <div className='space-y-8'>
              <div>
                <h2 className='mb-4 text-xl font-semibold'>
                  Freelancer Statistics
                </h2>
                <ReviewStatsComponent userId={user.id} type='freelancer' />
              </div>
              <div>
                <h2 className='mb-4 text-xl font-semibold'>
                  Client Statistics
                </h2>
                <ReviewStatsComponent userId={user.id} type='client' />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
