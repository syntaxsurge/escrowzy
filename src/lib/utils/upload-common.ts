import { apiEndpoints } from '@/config/api-endpoints'

export interface UploadConfig {
  uploadType: 'attachments' | 'avatars' | 'payment-proofs'
  subPath?: string
}

export interface ProcessedFile {
  buffer: Buffer
  filename: string
  originalName: string
  mimeType: string
  size: number
  extension: string
  relativePath: string
  absolutePath: string
}

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImageFile(
  file: File,
  maxSize: number = MAX_AVATAR_SIZE
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / 1024 / 1024}MB`
    }
  }

  // Basic MIME type check (will be verified again with file-type)
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image'
    }
  }

  return { valid: true }
}

export function getUploadUrl(relativePath: string): string {
  return apiEndpoints.uploads.getFile(relativePath)
}
