'use client'

import { useState } from 'react'

import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Loader2,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react'
import useSWR from 'swr'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils/cn'

// File content preview component
function FileContentPreview({
  fileId,
  filename,
  isCode
}: {
  fileId: number
  filename: string
  isCode: boolean
}) {
  const { data, isLoading, error } = useSWR(
    `/api/files/${fileId}/content`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any) : null
    }
  )

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className='flex h-full flex-col items-center justify-center p-6 text-center'>
        <FileText className='text-muted-foreground h-12 w-12' />
        <p className='mt-2 text-sm font-medium'>Failed to load file content</p>
        <p className='text-muted-foreground text-xs'>
          The file content could not be retrieved
        </p>
      </div>
    )
  }

  if (data.type === 'text') {
    return (
      <ScrollArea className='h-full'>
        <div className='p-6'>
          {isCode ? (
            <div>
              <pre className='bg-muted overflow-x-auto rounded-lg p-4'>
                <code className={`language-${data.language || 'plaintext'}`}>
                  {data.content}
                </code>
              </pre>
              {data.truncated && (
                <p className='text-muted-foreground mt-2 text-center text-xs'>
                  File truncated for preview (showing first 50KB)
                </p>
              )}
            </div>
          ) : (
            <div className='prose prose-sm max-w-none'>
              <pre className='whitespace-pre-wrap'>{data.content}</pre>
              {data.truncated && (
                <p className='text-muted-foreground mt-2 text-xs'>
                  File truncated for preview (showing first 50KB)
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    )
  }

  return null
}

interface FilePreviewProps {
  file: {
    id: number
    filename: string
    path: string
    mimeType: string
    size: number
  }
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
  onNavigate?: (direction: 'prev' | 'next') => void
  hasPrevious?: boolean
  hasNext?: boolean
}

export function FilePreview({
  file,
  isOpen,
  onClose,
  onDownload,
  onNavigate,
  hasPrevious = false,
  hasNext = false
}: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState(false)

  if (!file) return null

  // Determine file type
  const isImage = file.mimeType.startsWith('image/')
  const isVideo = file.mimeType.startsWith('video/')
  const isPDF = file.mimeType.includes('pdf')
  const isText =
    file.mimeType.startsWith('text/') ||
    file.filename.endsWith('.txt') ||
    file.filename.endsWith('.md') ||
    file.filename.endsWith('.json') ||
    file.filename.endsWith('.yaml') ||
    file.filename.endsWith('.yml')
  const isCode =
    file.filename.endsWith('.js') ||
    file.filename.endsWith('.jsx') ||
    file.filename.endsWith('.ts') ||
    file.filename.endsWith('.tsx') ||
    file.filename.endsWith('.css') ||
    file.filename.endsWith('.scss') ||
    file.filename.endsWith('.html') ||
    file.filename.endsWith('.py') ||
    file.filename.endsWith('.java') ||
    file.filename.endsWith('.cpp') ||
    file.filename.endsWith('.c') ||
    file.filename.endsWith('.go') ||
    file.filename.endsWith('.rs') ||
    file.filename.endsWith('.php')

  // Get file icon
  const getFileIcon = () => {
    if (isImage) return <FileImage className='h-5 w-5' />
    if (isVideo) return <FileVideo className='h-5 w-5' />
    if (isPDF || isText) return <FileText className='h-5 w-5' />
    if (isCode) return <FileCode className='h-5 w-5' />
    return <FileText className='h-5 w-5' />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get language for code highlighting
  const getCodeLanguage = () => {
    const ext = file.filename.split('.').pop()
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash'
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'transition-all',
          isFullscreen
            ? 'h-screen w-screen max-w-full p-0'
            : 'sm:max-h-[90vh] sm:max-w-4xl'
        )}
      >
        {/* Header */}
        <DialogHeader
          className={cn(
            'flex flex-row items-center justify-between border-b px-6 py-4',
            isFullscreen && 'bg-background fixed top-0 right-0 left-0 z-50'
          )}
        >
          <div className='flex items-center gap-3'>
            {getFileIcon()}
            <div>
              <DialogTitle className='text-base'>{file.filename}</DialogTitle>
              <p className='text-muted-foreground text-xs'>
                {formatFileSize(file.size)} • {file.mimeType}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {/* Navigation */}
            {onNavigate && (
              <>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onNavigate('prev')}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onNavigate('next')}
                  disabled={!hasNext}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </>
            )}
            {/* Fullscreen */}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className='h-4 w-4' />
              ) : (
                <Maximize2 className='h-4 w-4' />
              )}
            </Button>
            {/* Download */}
            {onDownload && (
              <Button variant='ghost' size='icon' onClick={onDownload}>
                <Download className='h-4 w-4' />
              </Button>
            )}
            {/* Close */}
            <Button variant='ghost' size='icon' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div
          className={cn(
            'flex-1 overflow-hidden',
            isFullscreen && 'h-full pt-20'
          )}
        >
          {/* Image Preview */}
          {isImage && !imageError && (
            <div className='flex h-full items-center justify-center p-6'>
              <img
                src={file.path}
                alt={file.filename}
                className='max-h-full max-w-full object-contain'
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* Video Preview */}
          {isVideo && (
            <div className='flex h-full items-center justify-center p-6'>
              <video controls className='max-h-full max-w-full' src={file.path}>
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* PDF Preview */}
          {isPDF && (
            <div className='h-full w-full'>
              <iframe
                src={`${file.path}#view=FitH`}
                className='h-full w-full'
                title={file.filename}
              />
            </div>
          )}

          {/* Text/Code Preview */}
          {(isText || isCode) && (
            <FileContentPreview
              fileId={file.id}
              filename={file.filename}
              isCode={isCode}
            />
          )}

          {/* Unsupported file type or error */}
          {!isImage && !isVideo && !isPDF && !isText && !isCode && (
            <div className='flex h-full flex-col items-center justify-center p-6 text-center'>
              <FileText className='text-muted-foreground h-12 w-12' />
              <p className='mt-2 text-sm font-medium'>Preview not available</p>
              <p className='text-muted-foreground text-xs'>
                This file type cannot be previewed in the browser
              </p>
              {onDownload && (
                <Button onClick={onDownload} className='mt-4 gap-2'>
                  <Download className='h-4 w-4' />
                  Download File
                </Button>
              )}
            </div>
          )}

          {/* Image error fallback */}
          {isImage && imageError && (
            <div className='flex h-full flex-col items-center justify-center p-6 text-center'>
              <FileImage className='text-muted-foreground h-12 w-12' />
              <p className='mt-2 text-sm font-medium'>Failed to load image</p>
              <p className='text-muted-foreground text-xs'>
                The image could not be displayed
              </p>
              {onDownload && (
                <Button onClick={onDownload} className='mt-4 gap-2'>
                  <Download className='h-4 w-4' />
                  Download Image
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
