'use client'

import { useState } from 'react'

import { FileText, Link, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface FileUpload {
  name: string
  url: string
  size: number
  type: string
}

interface MilestoneSubmissionProps {
  isOpen: boolean
  onClose: () => void
  milestoneId: number
  milestoneTitle: string
  onSubmit: (data: {
    submissionUrl: string
    submissionNotes?: string
    files?: FileUpload[]
  }) => Promise<void>
}

export function MilestoneSubmission({
  isOpen,
  onClose,
  milestoneId,
  milestoneTitle,
  onSubmit
}: MilestoneSubmissionProps) {
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [files, setFiles] = useState<FileUpload[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = async (fileList: FileList) => {
    const newFiles: FileUpload[] = []

    // Upload files to server
    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', `milestones/${milestoneId}`)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newFiles.push({
            name: file.name,
            url: data.url,
            size: file.size,
            type: file.type
          })
        } else {
          console.error('Failed to upload file:', file.name)
          // Fallback to local URL for preview
          newFiles.push({
            name: file.name,
            url: URL.createObjectURL(file),
            size: file.size,
            type: file.type
          })
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        // Fallback to local URL for preview
        newFiles.push({
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type
        })
      }
    }

    setFiles([...files, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) {
      alert('Please provide a submission URL')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        submissionUrl,
        submissionNotes: submissionNotes.trim() || undefined,
        files: files.length > 0 ? files : undefined
      })

      // Reset form
      setSubmissionUrl('')
      setSubmissionNotes('')
      setFiles([])
      onClose()
    } catch (error) {
      console.error('Error submitting milestone:', error)
      alert('Failed to submit milestone. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Submit Milestone</DialogTitle>
          <DialogDescription>
            Submit your work for "{milestoneTitle}" for client review
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Submission URL */}
          <div className='space-y-2'>
            <Label htmlFor='submission-url'>
              Submission URL <span className='text-red-500'>*</span>
            </Label>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Link className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                <Input
                  id='submission-url'
                  type='url'
                  placeholder='https://github.com/project/milestone-1'
                  value={submissionUrl}
                  onChange={e => setSubmissionUrl(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <p className='text-muted-foreground text-xs'>
              Provide a link to your completed work (GitHub, Google Drive, etc.)
            </p>
          </div>

          {/* Submission Notes */}
          <div className='space-y-2'>
            <Label htmlFor='submission-notes'>Notes (Optional)</Label>
            <Textarea
              id='submission-notes'
              placeholder='Any additional notes about the submission...'
              value={submissionNotes}
              onChange={e => setSubmissionNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* File Attachments */}
          <div className='space-y-2'>
            <Label>Attachments (Optional)</Label>
            <div
              className={cn(
                'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className='text-muted-foreground mx-auto h-8 w-8' />
              <p className='text-muted-foreground mt-2 text-sm'>
                Drag and drop files here, or{' '}
                <label className='text-primary cursor-pointer hover:underline'>
                  browse
                  <input
                    type='file'
                    multiple
                    className='hidden'
                    onChange={e =>
                      e.target.files && handleFiles(e.target.files)
                    }
                  />
                </label>
              </p>
              <p className='text-muted-foreground text-xs'>
                Support for images, documents, and archives
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className='space-y-2'>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded-lg border p-2'
                  >
                    <div className='flex items-center gap-2'>
                      <FileText className='text-muted-foreground h-4 w-4' />
                      <div>
                        <p className='text-sm font-medium'>{file.name}</p>
                        <p className='text-muted-foreground text-xs'>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeFile(index)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Work'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
