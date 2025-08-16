import { redirect } from 'next/navigation'

import { AdminReviewModeration } from '@/components/blocks/admin/review-moderation'
import { getServerSession } from '@/lib/auth'

export default async function AdminReviewsPage() {
  const session = await getServerSession()

  // Check if user is admin
  if (!session || session.user?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className='container mx-auto py-8'>
      <h1 className='mb-8 text-3xl font-bold'>Review Moderation</h1>
      <AdminReviewModeration />
    </div>
  )
}
