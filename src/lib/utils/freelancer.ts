// Freelancer utility functions that can be used on both client and server

export interface FreelancerProfileForCompleteness {
  professionalTitle?: string | null
  bio?: string | null
  hourlyRate?: number | null
  skills?: unknown[]
  portfolioItems?: unknown[]
  user: {
    avatarUrl?: string | null
  }
  yearsOfExperience: number
  languages?: unknown
  portfolioUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
}

export function calculateProfileCompleteness(
  profile: FreelancerProfileForCompleteness
): number {
  let completeness = 0
  const weights = {
    basicInfo: 20, // title, bio, hourly rate
    skills: 20,
    portfolio: 20,
    avatar: 10,
    experience: 10,
    languages: 10,
    links: 10 // portfolio, linkedin, github
  }

  // Basic info
  if (profile.professionalTitle && profile.bio && profile.hourlyRate) {
    completeness += weights.basicInfo
  }

  // Skills
  if (profile.skills && profile.skills.length >= 3) {
    completeness += weights.skills
  }

  // Portfolio
  if (profile.portfolioItems && profile.portfolioItems.length >= 1) {
    completeness += weights.portfolio
  }

  // Avatar
  if (profile.user.avatarUrl) {
    completeness += weights.avatar
  }

  // Experience
  if (profile.yearsOfExperience > 0) {
    completeness += weights.experience
  }

  // Languages
  const languages = profile.languages as any
  if (languages && Array.isArray(languages) && languages.length > 0) {
    completeness += weights.languages
  }

  // Links
  const linksCount = [
    profile.portfolioUrl,
    profile.linkedinUrl,
    profile.githubUrl
  ].filter(Boolean).length

  if (linksCount >= 2) {
    completeness += weights.links
  } else if (linksCount === 1) {
    completeness += weights.links / 2
  }

  return Math.min(100, completeness)
}
