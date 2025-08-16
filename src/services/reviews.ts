import 'server-only'

import { getJobById } from '@/lib/db/queries/jobs'
import {
  createFreelancerReview,
  createClientReview,
  checkReviewExists,
  getJobReviews,
  addReviewResponse,
  getPendingReviewPrompts
} from '@/lib/db/queries/reviews'
import { findUserById } from '@/lib/db/queries/users'
import { sendEmail } from '@/lib/email'
import type {
  FreelancerReviewInput,
  ClientReviewInput,
  ReviewResponse
} from '@/lib/schemas/reviews'

const REVIEW_XP_REWARD = 50
const FIVE_STAR_BONUS_XP = 25

export async function submitFreelancerReview(
  reviewerId: number,
  data: FreelancerReviewInput
): Promise<{ success: boolean; message: string; reviewId?: number }> {
  try {
    const job = await getJobById(data.jobId)
    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    if (job.clientId !== reviewerId) {
      return {
        success: false,
        message: 'You are not authorized to review this freelancer'
      }
    }

    if (job.status !== 'completed') {
      return { success: false, message: 'You can only review completed jobs' }
    }

    const existingReview = await checkReviewExists(
      data.jobId,
      reviewerId,
      'freelancer'
    )
    if (existingReview) {
      return {
        success: false,
        message: 'You have already reviewed this freelancer'
      }
    }

    const review = await createFreelancerReview({
      jobId: data.jobId,
      reviewerId,
      freelancerId: data.freelancerId,
      rating: data.rating,
      reviewText: data.reviewText,
      communicationRating: data.communicationRating,
      qualityRating: data.qualityRating,
      deadlineRating: data.deadlineRating,
      skillsRating: data.skillsRating,
      wouldHireAgain: data.wouldHireAgain,
      isPublic: data.isPublic,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const xpReward =
      REVIEW_XP_REWARD + (data.rating === 5 ? FIVE_STAR_BONUS_XP : 0)
    // TODO: Update user game data with XP reward

    // await checkAndAwardAchievements(reviewerId, 'review_submitted')

    const freelancer = await findUserById(data.freelancerId)
    if (freelancer?.email) {
      await sendEmail({
        to: freelancer.email,
        subject: 'You received a new review',
        html: `
          <h2>New Review Received</h2>
          <p>You have received a ${data.rating}-star review for your work on "${job.title}".</p>
          <p><strong>Review:</strong> ${data.reviewText}</p>
          <p>Log in to view the full review and respond.</p>
        `
      })
    }

    return {
      success: true,
      message: 'Review submitted successfully',
      reviewId: review.id
    }
  } catch (error) {
    console.error('Error submitting freelancer review:', error)
    return { success: false, message: 'Failed to submit review' }
  }
}

export async function submitClientReview(
  reviewerId: number,
  data: ClientReviewInput
): Promise<{ success: boolean; message: string; reviewId?: number }> {
  try {
    const job = await getJobById(data.jobId)
    if (!job) {
      return { success: false, message: 'Job not found' }
    }

    if (job.freelancerId !== reviewerId) {
      return {
        success: false,
        message: 'You are not authorized to review this client'
      }
    }

    if (job.status !== 'completed') {
      return { success: false, message: 'You can only review completed jobs' }
    }

    const existingReview = await checkReviewExists(
      data.jobId,
      reviewerId,
      'client'
    )
    if (existingReview) {
      return {
        success: false,
        message: 'You have already reviewed this client'
      }
    }

    const review = await createClientReview({
      jobId: data.jobId,
      reviewerId,
      clientId: data.clientId,
      rating: data.rating,
      reviewText: data.reviewText,
      paymentRating: data.paymentRating,
      communicationRating: data.communicationRating,
      clarityRating: data.clarityRating,
      wouldWorkAgain: data.wouldWorkAgain,
      isPublic: data.isPublic,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const xpReward =
      REVIEW_XP_REWARD + (data.rating === 5 ? FIVE_STAR_BONUS_XP : 0)
    // TODO: Update user game data with XP reward

    // await checkAndAwardAchievements(reviewerId, 'review_submitted')

    const client = await findUserById(data.clientId)
    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: 'You received a new review',
        html: `
          <h2>New Review Received</h2>
          <p>You have received a ${data.rating}-star review for the job "${job.title}".</p>
          <p><strong>Review:</strong> ${data.reviewText}</p>
          <p>Log in to view the full review and respond.</p>
        `
      })
    }

    return {
      success: true,
      message: 'Review submitted successfully',
      reviewId: review.id
    }
  } catch (error) {
    console.error('Error submitting client review:', error)
    return { success: false, message: 'Failed to submit review' }
  }
}

export async function respondToReview(
  userId: number,
  reviewId: number,
  type: 'freelancer' | 'client',
  data: ReviewResponse
): Promise<{ success: boolean; message: string }> {
  try {
    await addReviewResponse(reviewId, data.response, type)

    // TODO: Update user game data with XP reward

    return { success: true, message: 'Response added successfully' }
  } catch (error) {
    console.error('Error responding to review:', error)
    return { success: false, message: 'Failed to add response' }
  }
}

export async function getReviewPrompts(userId: number): Promise<
  Array<{
    jobId: number
    jobTitle: string
    completedAt: Date
    type: 'freelancer' | 'client'
    targetUserId: number
    targetUserName: string | null
    daysAgo: number
  }>
> {
  const prompts = await getPendingReviewPrompts(userId)

  return prompts.map(prompt => {
    const daysAgo = Math.floor(
      (Date.now() - prompt.completedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      ...prompt,
      daysAgo
    }
  })
}

export async function sendReviewReminders(): Promise<void> {
  try {
    const users = await getUsersWithPendingReviews()

    for (const user of users) {
      const prompts = await getPendingReviewPrompts(user.id)

      if (prompts.length > 0 && user.email) {
        const promptList = prompts
          .slice(0, 5)
          .map(
            p =>
              `- ${p.jobTitle} (${p.type === 'freelancer' ? 'Review freelancer' : 'Review client'})`
          )
          .join('\n')

        await sendEmail({
          to: user.email,
          subject: `You have ${prompts.length} pending review${prompts.length > 1 ? 's' : ''}`,
          html: `
            <h2>Pending Reviews</h2>
            <p>Please take a moment to review your recent completed jobs:</p>
            <ul>
              ${promptList}
            </ul>
            <p>Writing reviews helps build trust in our community and earns you XP rewards!</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/reviews/pending">Write Reviews Now</a></p>
          `
        })
      }
    }
  } catch (error) {
    console.error('Error sending review reminders:', error)
  }
}

export async function checkMutualReviews(jobId: number): Promise<{
  hasFreelancerReview: boolean
  hasClientReview: boolean
  canReveal: boolean
}> {
  const { freelancerReview, clientReview } = await getJobReviews(jobId)

  return {
    hasFreelancerReview: !!freelancerReview,
    hasClientReview: !!clientReview,
    canReveal: !!freelancerReview && !!clientReview
  }
}

async function getUsersWithPendingReviews(): Promise<
  Array<{ id: number; email: string | null }>
> {
  return []
}
