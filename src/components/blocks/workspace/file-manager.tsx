'use client'

import { useCallback, useState } from 'react'

import { format } from 'date-fns'
import {
  Clock,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  MessageSquare,
  MoreVertical,
  Search,
  Trash2,
  Upload
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/http-client'
import { cn } from '@/lib/utils'

import { FileAnnotations } from './file-annotations'
import { FilePreview } from './file-preview'

interface FileVersion {
  id: number
  originalFileId: number | null
  versionNumber: number
  filename: string
  path: string
  size: number
  mimeType: string
  uploadedBy: {
    id: number
    name: string
    avatarUrl: string | null
  }
  changeDescription: string | null
  isLatest: boolean
  createdAt: Date
}

interface FileItem {
  id: number
  filename: string
  path: string
  size: number
  mimeType: string
  versions: FileVersion[]
  latestVersion: FileVersion
  uploadedBy: {
    id: number
    name: string
    avatarUrl: string | null
  }
  createdAt: Date
  annotations?: number
}

interface FileManagerProps {
  jobId: number
  isClient: boolean
  isFreelancer: boolean
}

export function FileManager({
  jobId,
  isClient,
  isFreelancer
}: FileManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadDescription, setUploadDescription] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  // Fetch files
  const { data: files, mutate } = useSWR(
    `/api/jobs/${jobId}/files`,
    async (url: string) => {
      const response = await api.get(url)
      return response.success ? (response as any).files : []
    }
  )

  // File upload handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('files', file)
      })
      formData.append('description', uploadDescription)

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        const response = await api.post(
          `/api/jobs/${jobId}/files/upload`,
          formData
        )

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (response.success) {
          await mutate()
          setShowUploadDialog(false)
          setUploadDescription('')
        }
      } catch (error) {
        console.error('Upload failed:', error)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [jobId, uploadDescription, mutate]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading
  })

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className='h-4 w-4' />
    if (mimeType.startsWith('video/')) return <FileVideo className='h-4 w-4' />
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className='h-4 w-4' />
    }
    return <File className='h-4 w-4' />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Filter files based on search
  const filteredFiles =
    files?.filter((file: FileItem) =>
      file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <div className='relative max-w-md'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search files...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className='gap-2'>
              <Upload className='h-4 w-4' />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Upload new files or new versions of existing files
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='description'>
                  Version Description (Optional)
                </Label>
                <Textarea
                  id='description'
                  placeholder='Describe the changes in this version...'
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  className='mt-2'
                  rows={3}
                />
              </div>
              <div
                {...getRootProps()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  isDragActive && 'border-primary bg-primary/5',
                  isUploading && 'cursor-not-allowed opacity-50'
                )}
              >
                <input {...getInputProps()} />
                <Upload className='text-muted-foreground mx-auto h-12 w-12' />
                <p className='mt-2 text-sm font-medium'>
                  {isDragActive
                    ? 'Drop files here...'
                    : 'Drag & drop files here, or click to select'}
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Support for images, documents, videos, and more
                </p>
              </div>
              {isUploading && (
                <div>
                  <div className='flex items-center justify-between text-sm'>
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className='mt-2' />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Files Grid */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {filteredFiles.map((file: FileItem) => (
          <Card
            key={file.id}
            className='cursor-pointer transition-shadow hover:shadow-lg'
            onClick={() => setSelectedFile(file)}
          >
            <CardContent className='p-4'>
              <div className='flex items-start justify-between'>
                <div className='flex items-start gap-3'>
                  <div className='bg-muted rounded-lg p-2'>
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>
                      {file.filename}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {formatFileSize(file.size)} • v
                      {file.latestVersion.versionNumber}
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      by {file.uploadedBy.name}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={e => e.stopPropagation()}
                  >
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() => {
                        setPreviewFile(file)
                        setShowPreview(true)
                      }}
                    >
                      <Eye className='mr-2 h-4 w-4' />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedFile(file)
                        setShowAnnotations(true)
                      }}
                    >
                      <MessageSquare className='mr-2 h-4 w-4' />
                      Annotations
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className='mr-2 h-4 w-4' />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Clock className='mr-2 h-4 w-4' />
                      Version History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className='text-red-600'>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className='mt-3 flex items-center gap-2'>
                {file.versions.length > 1 && (
                  <Badge variant='secondary' className='text-xs'>
                    {file.versions.length} versions
                  </Badge>
                )}
                {file.annotations && file.annotations > 0 && (
                  <Badge variant='outline' className='text-xs'>
                    {file.annotations} comments
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <FolderOpen className='text-muted-foreground h-12 w-12' />
            <p className='mt-2 text-sm font-medium'>No files found</p>
            <p className='text-muted-foreground text-xs'>
              {searchQuery
                ? 'Try a different search term'
                : 'Upload your first file to get started'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* File Details Dialog */}
      {selectedFile && (
        <Dialog
          open={!!selectedFile}
          onOpenChange={() => setSelectedFile(null)}
        >
          <DialogContent className='sm:max-w-2xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {getFileIcon(selectedFile.mimeType)}
                {selectedFile.filename}
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              {/* File Info */}
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-muted-foreground'>Size</p>
                  <p className='font-medium'>
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Type</p>
                  <p className='font-medium'>{selectedFile.mimeType}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Uploaded by</p>
                  <p className='font-medium'>{selectedFile.uploadedBy.name}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Created</p>
                  <p className='font-medium'>
                    {format(new Date(selectedFile.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {/* Version History */}
              <div>
                <h4 className='mb-3 text-sm font-medium'>Version History</h4>
                <ScrollArea className='h-[200px]'>
                  <div className='space-y-2'>
                    {selectedFile.versions.map(version => (
                      <div
                        key={version.id}
                        className={cn(
                          'rounded-lg border p-3',
                          version.isLatest && 'border-primary bg-primary/5'
                        )}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant={
                                version.isLatest ? 'default' : 'secondary'
                              }
                            >
                              v{version.versionNumber}
                            </Badge>
                            {version.isLatest && (
                              <Badge variant='outline'>Latest</Badge>
                            )}
                          </div>
                          <Button variant='ghost' size='sm'>
                            <Download className='h-4 w-4' />
                          </Button>
                        </div>
                        {version.changeDescription && (
                          <p className='text-muted-foreground mt-2 text-xs'>
                            {version.changeDescription}
                          </p>
                        )}
                        <p className='text-muted-foreground mt-1 text-xs'>
                          by {version.uploadedBy.name} •
                          {format(
                            new Date(version.createdAt),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className='flex gap-2'>
                <Button className='flex-1'>
                  <Eye className='mr-2 h-4 w-4' />
                  Preview
                </Button>
                <Button variant='outline' className='flex-1'>
                  <Download className='mr-2 h-4 w-4' />
                  Download Latest
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* File Preview */}
      {previewFile && (
        <FilePreview
          file={previewFile.latestVersion || previewFile}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setPreviewFile(null)
          }}
          onDownload={() => {
            // Handle download
            window.open(previewFile.path, '_blank')
          }}
        />
      )}

      {/* File Annotations */}
      {selectedFile && showAnnotations && (
        <FileAnnotations
          fileVersionId={selectedFile.latestVersion?.id || selectedFile.id}
          fileType={selectedFile.mimeType}
          isOpen={showAnnotations}
          onClose={() => {
            setShowAnnotations(false)
            setSelectedFile(null)
          }}
          canAnnotate={isClient || isFreelancer}
        />
      )}
    </div>
  )
}
