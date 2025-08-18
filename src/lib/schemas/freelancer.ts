import { z } from 'zod'

// Language proficiency schema
export const languageSchema = z.object({
  language: z.string().min(1, 'Language is required'),
  level: z.enum(['basic', 'conversational', 'fluent', 'native'])
})

// Skill schema
export const freelancerSkillSchema = z.object({
  skillId: z.number().positive('Invalid skill ID'),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'expert']).optional()
})

// Profile setup schema
export const freelancerProfileSchema = z.object({
  professionalTitle: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  bio: z
    .string()
    .min(20, 'Bio must be at least 20 characters')
    .max(5000, 'Bio must be less than 5000 characters')
    .optional(),
  hourlyRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid hourly rate format')
    .optional(),
  availability: z.enum(['available', 'busy', 'away']).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  languages: z
    .array(languageSchema)
    .min(1, 'At least one language is required')
    .optional(),
  timezone: z.string().optional(),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedinUrl: z
    .string()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal(''))
})

// Profile setup wizard schemas (for each step)
export const profileBasicInfoSchema = z.object({
  professionalTitle: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  bio: z
    .string()
    .min(20, 'Bio must be at least 20 characters')
    .max(5000, 'Bio must be less than 5000 characters'),
  hourlyRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid hourly rate format'),
  yearsOfExperience: z.number().min(0).max(50)
})

export const profileSkillsSchema = z.object({
  skills: z
    .array(freelancerSkillSchema)
    .min(1, 'Select at least one skill')
    .max(20, 'Maximum 20 skills allowed')
})

export const profilePortfolioSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  skillsUsed: z.array(z.number()).optional(),
  projectUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  completionDate: z.date().optional(),
  clientName: z.string().max(100).optional()
})

export const profileAvailabilitySchema = z.object({
  availability: z.enum(['available', 'busy', 'away']),
  languages: z
    .array(languageSchema)
    .min(1, 'At least one language is required'),
  timezone: z.string().min(1, 'Timezone is required')
})

export const profileLinksSchema = z.object({
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedinUrl: z
    .string()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal(''))
})

// Search filters schema
export const freelancerSearchSchema = z.object({
  search: z.string().optional(),
  skills: z.array(z.number()).optional(),
  minRate: z.number().min(0).optional(),
  maxRate: z.number().min(0).optional(),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']).optional(),
  availability: z.enum(['available', 'busy', 'away']).optional(),
  languages: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  verified: z.boolean().optional(),
  sortBy: z
    .enum(['newest', 'rating', 'price_low', 'price_high', 'experience'])
    .optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
})

// Work experience schema
export const workExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(100),
  position: z.string().min(1, 'Position is required').max(100),
  startDate: z.date(),
  endDate: z.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(1000).optional(),
  skills: z.array(z.number()).optional()
})

// Education schema
export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required').max(200),
  degree: z.string().min(1, 'Degree is required').max(100),
  fieldOfStudy: z.string().min(1, 'Field of study is required').max(100),
  startYear: z.number().min(1900).max(new Date().getFullYear()),
  endYear: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 10)
    .optional(),
  description: z.string().max(500).optional()
})

// Availability schedule schema (for calendar)
export const availabilityScheduleSchema = z.object({
  monday: z.object({
    available: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }),
  tuesday: z.object({
    available: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }),
  wednesday: z.object({
    available: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }),
  thursday: z.object({
    available: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }),
  friday: z.object({
    available: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }),
  saturday: z.object({
    available: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }),
  sunday: z.object({
    available: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  })
})

// Type exports
export type FreelancerProfileFormData = z.infer<typeof freelancerProfileSchema>
export type ProfileBasicInfoFormData = z.infer<typeof profileBasicInfoSchema>
export type ProfileSkillsFormData = z.infer<typeof profileSkillsSchema>
export type ProfilePortfolioFormData = z.infer<typeof profilePortfolioSchema>
export type ProfileAvailabilityFormData = z.infer<
  typeof profileAvailabilitySchema
>
export type ProfileLinksFormData = z.infer<typeof profileLinksSchema>
export type FreelancerSearchFormData = z.infer<typeof freelancerSearchSchema>
export type WorkExperienceFormData = z.infer<typeof workExperienceSchema>
export type EducationFormData = z.infer<typeof educationSchema>
export type AvailabilityScheduleFormData = z.infer<
  typeof availabilityScheduleSchema
>
export type LanguageFormData = z.infer<typeof languageSchema>
