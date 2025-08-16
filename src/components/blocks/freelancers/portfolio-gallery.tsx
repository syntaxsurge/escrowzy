'use client'

import { useState } from 'react'

import {
  Plus,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon
} from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import type { PortfolioItem } from '@/lib/db/schema'

interface PortfolioGalleryProps {
  items: PortfolioItem[]
  editable?: boolean
  onAdd?: () => void
  onEdit?: (item: PortfolioItem) => void
  onDelete?: (itemId: number) => void
  onView?: (item: PortfolioItem) => void
}

export function PortfolioGallery({
  items,
  editable = false,
  onAdd,
  onEdit,
  onDelete,
  onView
}: PortfolioGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)

  const handleView = (item: PortfolioItem) => {
    if (onView) {
      onView(item)
    } else {
      setSelectedItem(item)
    }
  }

  const getImages = (item: PortfolioItem): string[] => {
    if (!item.images) return []
    if (typeof item.images === 'string') {
      try {
        return JSON.parse(item.images)
      } catch {
        return []
      }
    }
    return item.images as string[]
  }

  const getSkills = (item: PortfolioItem): number[] => {
    if (!item.skillsUsed) return []
    if (typeof item.skillsUsed === 'string') {
      try {
        return JSON.parse(item.skillsUsed)
      } catch {
        return []
      }
    }
    return item.skillsUsed as number[]
  }

  if (items.length === 0 && !editable) {
    return (
      <div className='py-12 text-center'>
        <ImageIcon className='text-muted-foreground/50 mx-auto h-12 w-12' />
        <p className='text-muted-foreground mt-4'>No portfolio items yet</p>
      </div>
    )
  }

  return (
    <>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {editable && (
          <Card className='hover:border-primary cursor-pointer border-dashed transition-colors'>
            <CardContent
              className='flex h-64 flex-col items-center justify-center'
              onClick={onAdd}
            >
              <Plus className='text-muted-foreground mb-2 h-12 w-12' />
              <p className='text-muted-foreground text-sm'>
                Add Portfolio Item
              </p>
            </CardContent>
          </Card>
        )}

        {items.map(item => {
          const images = getImages(item)
          const firstImage = images[0]

          return (
            <Card
              key={item.id}
              className='overflow-hidden transition-shadow hover:shadow-lg'
            >
              <div
                className='bg-muted relative h-48 cursor-pointer'
                onClick={() => handleView(item)}
              >
                {firstImage ? (
                  <img
                    src={firstImage}
                    alt={item.title}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='flex h-full items-center justify-center'>
                    <ImageIcon className='text-muted-foreground/50 h-12 w-12' />
                  </div>
                )}
                {item.isHighlighted && (
                  <Badge className='absolute top-2 right-2' variant='default'>
                    Featured
                  </Badge>
                )}
                {images.length > 1 && (
                  <Badge
                    className='absolute right-2 bottom-2'
                    variant='secondary'
                  >
                    +{images.length - 1} more
                  </Badge>
                )}
              </div>

              <CardHeader className='pb-3'>
                <h3 className='line-clamp-1 font-semibold'>{item.title}</h3>
                {item.clientName && (
                  <p className='text-muted-foreground text-sm'>
                    Client: {item.clientName}
                  </p>
                )}
              </CardHeader>

              {item.description && (
                <CardContent className='pt-0 pb-3'>
                  <p className='text-muted-foreground line-clamp-2 text-sm'>
                    {item.description}
                  </p>
                </CardContent>
              )}

              <CardFooter className='pt-0'>
                <div className='flex w-full items-center justify-between'>
                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Eye className='h-4 w-4' />
                    {item.viewCount}
                  </div>
                  <div className='flex items-center gap-1'>
                    {item.projectUrl && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={e => {
                          e.stopPropagation()
                          window.open(item.projectUrl!, '_blank')
                        }}
                      >
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                    )}
                    {editable && (
                      <>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation()
                            onEdit?.(item)
                          }}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation()
                            setDeleteItemId(item.id)
                          }}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto'>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                {selectedItem.clientName && (
                  <DialogDescription>
                    Client: {selectedItem.clientName}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className='space-y-4'>
                {getImages(selectedItem).length > 0 && (
                  <div className='grid grid-cols-1 gap-4'>
                    {getImages(selectedItem).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${selectedItem.title} ${index + 1}`}
                        className='w-full rounded-lg'
                      />
                    ))}
                  </div>
                )}
                {selectedItem.description && (
                  <div>
                    <h4 className='mb-2 font-medium'>Description</h4>
                    <p className='text-muted-foreground'>
                      {selectedItem.description}
                    </p>
                  </div>
                )}
                {selectedItem.completionDate && (
                  <div>
                    <h4 className='mb-2 font-medium'>Completion Date</h4>
                    <p className='text-muted-foreground'>
                      {new Date(
                        selectedItem.completionDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedItem.projectUrl && (
                  <div>
                    <Button
                      variant='outline'
                      onClick={() =>
                        window.open(selectedItem.projectUrl!, '_blank')
                      }
                    >
                      <ExternalLink className='mr-2 h-4 w-4' />
                      View Project
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteItemId !== null}
        onOpenChange={() => setDeleteItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this portfolio item? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteItemId) {
                  onDelete?.(deleteItemId)
                  setDeleteItemId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
