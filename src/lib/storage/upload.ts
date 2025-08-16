import { randomBytes } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function uploadToStorage(
  file: File,
  folder: string
): Promise<string> {
  try {
    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename with original extension
    const uniqueId = randomBytes(16).toString('hex')
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${uniqueId}.${fileExt}`

    // Define upload directory (public folder for Next.js)
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder)

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Return public URL
    return `/uploads/${folder}/${fileName}`
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload file')
  }
}
