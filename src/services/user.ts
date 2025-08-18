import 'server-only'
import { cookies } from 'next/headers'

import { desc, eq } from 'drizzle-orm'

import { verifyToken } from '@/lib/auth/session'
import { validateSession } from '@/lib/db/queries/sessions'

import { db } from '../lib/db/drizzle'
import {
  activityLogs,
  teamMembers,
  teams,
  users,
  ActivityType
} from '../lib/db/schema'

export async function getUser() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie || !sessionCookie.value) {
    return null
  }

  let sessionData
  try {
    sessionData = await verifyToken(sessionCookie.value)
  } catch (_error) {
    // Invalid JWT - just return null, middleware will handle cookie cleanup
    return null
  }

  // Validate session structure
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number' ||
    !sessionData.sessionToken ||
    !sessionData.expires
  ) {
    return null
  }

  // Check JWT expiry
  if (new Date(sessionData.expires) < new Date()) {
    return null
  }

  try {
    // Validate session exists in database and is not expired
    const dbSession = await validateSession(sessionData.sessionToken)
    if (!dbSession) {
      // Session doesn't exist in DB or is expired
      return null
    }

    // Check if user ID matches
    if (dbSession.userId !== sessionData.user.id) {
      return null
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionData.user.id))
      .limit(1)

    if (user.length === 0) {
      // User doesn't exist
      return null
    }

    // Return the user data
    return user[0]
  } catch (error) {
    // Database error - fail closed (deny access)
    console.error('Session validation error:', error)
    return null
  }
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1)

  return result[0]
}

export async function getActivityLogs() {
  const user = await getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const team = await getTeamForUser()
  if (!team) {
    throw new Error('User has no team')
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.teamId, team.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10)
}

export async function getTeamForUser() {
  const user = await getUser()
  if (!user) {
    return null
  }

  // Get user's team memberships
  const userMemberships = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))

  if (!userMemberships.length) {
    return null
  }

  // Get the first team
  const firstMembership = userMemberships[0]

  // Get team data
  const teamData = await db
    .select()
    .from(teams)
    .where(eq(teams.id, firstMembership.teamId))
    .limit(1)

  if (!teamData[0]) {
    return null
  }

  // Get all team members
  const allTeamMembers = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      teamId: teamMembers.teamId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
      userWalletAddress: users.walletAddress
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamData[0].id))

  // Structure the data to match TeamDataWithMembers
  return {
    ...teamData[0],
    teamMembers: allTeamMembers.map(member => ({
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.userId,
        name: member.userName,
        email: member.userEmail,
        walletAddress: member.userWalletAddress
      }
    }))
  }
}

export const getTeam = getTeamForUser

export async function checkAdminRole() {
  const user = await getUser()
  if (!user) {
    return false
  }

  return user.role === 'admin'
}

export async function logActivity(
  userId: number,
  teamId: number,
  activityType: ActivityType,
  _activityData?: any
) {
  await db.insert(activityLogs).values({
    userId,
    teamId,
    action: activityType,
    timestamp: new Date()
  })
}

export async function getPaymentHistory(teamId: number) {
  const { paymentHistory } = await import('../lib/db/schema')
  return await db
    .select()
    .from(paymentHistory)
    .where(eq(paymentHistory.teamId, teamId))
    .orderBy(desc(paymentHistory.createdAt))
}
