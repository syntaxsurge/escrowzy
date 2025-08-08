'use client'

import { useState } from 'react'

import { Trash2, Edit, Power, PowerOff, RefreshCw } from 'lucide-react'
import useSWR from 'swr'

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
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { apiEndpoints } from '@/config/api-endpoints'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api/http-client'
import { handleFormError, handleFormSuccess } from '@/lib/utils/form'
import { formatRelativeTime } from '@/lib/utils/string'
import type { P2PListing } from '@/types/listings'

import { UpdateListingDialog } from './update-listing-dialog'

interface MyListingsProps {
  onRefresh?: () => void
}

export function MyListings({ onRefresh }: MyListingsProps) {
  const { toast } = useToast()
  const [selectedListing, setSelectedListing] = useState<P2PListing | null>(
    null
  )
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch user's listings
  const { data, error, isLoading, mutate } = useSWR<P2PListing[]>(
    apiEndpoints.listings.user,
    async () => {
      const res = await api.get(apiEndpoints.listings.user)
      // Ensure we always return an array
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : []
      }
      return []
    },
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  // Ensure listings is always an array
  const listings = Array.isArray(data) ? data : []

  const handleToggleStatus = async (listing: P2PListing) => {
    try {
      const response = await api.put(
        apiEndpoints.listings.byId(listing.id.toString()),
        {
          isActive: !listing.isActive
        }
      )

      if (response.success) {
        handleFormSuccess(
          toast,
          `Listing ${listing.isActive ? 'deactivated' : 'activated'} successfully`
        )
        mutate()
        if (onRefresh) onRefresh()
      } else {
        throw new Error(response.error || 'Failed to update listing')
      }
    } catch (error) {
      handleFormError(error, toast, 'Failed to update listing')
    }
  }

  const handleDelete = async () => {
    if (!selectedListing) return

    try {
      setIsDeleting(true)
      const response = await api.delete(
        apiEndpoints.listings.byId(selectedListing.id.toString())
      )

      if (response.success) {
        handleFormSuccess(toast, 'Listing deleted successfully')
        mutate()
        if (onRefresh) onRefresh()
      } else {
        throw new Error(response.error || 'Failed to delete listing')
      }
    } catch (error) {
      handleFormError(error, toast, 'Failed to delete listing')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedListing(null)
    }
  }

  const handleUpdateSuccess = () => {
    setUpdateDialogOpen(false)
    setSelectedListing(null)
    mutate()
    if (onRefresh) onRefresh()
    toast({
      title: 'Success',
      description: 'Listing updated successfully'
    })
  }

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Spinner size='lg' />
      </div>
    )
  }

  if (error) {
    return (
      <Card className='p-8 text-center'>
        <p className='text-destructive mb-4'>Failed to load your listings</p>
        <Button variant='outline' onClick={() => mutate()}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Retry
        </Button>
      </Card>
    )
  }

  if (listings.length === 0) {
    return (
      <Card className='p-12 text-center'>
        <p className='text-muted-foreground mb-2'>
          You haven't created any listings yet
        </p>
        <p className='text-muted-foreground text-sm'>
          Click "Create Listing" to start trading
        </p>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Price/Unit</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map(listing => {
              const totalValue =
                parseFloat(listing.amount ?? '0') *
                parseFloat(listing.pricePerUnit ?? '0')

              return (
                <TableRow key={listing.id}>
                  <TableCell>
                    <Badge
                      variant={
                        listing.listingType === 'sell' ? 'default' : 'secondary'
                      }
                    >
                      {listing.listingType}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-medium'>
                    {listing.tokenOffered}
                  </TableCell>
                  <TableCell>{listing.amount}</TableCell>
                  <TableCell>${listing.pricePerUnit}</TableCell>
                  <TableCell className='font-semibold'>
                    ${totalValue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={listing.isActive ? 'success' : 'secondary'}>
                      {listing.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatRelativeTime(listing.createdAt)}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleToggleStatus(listing)}
                        title={listing.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {listing.isActive ? (
                          <PowerOff className='h-4 w-4' />
                        ) : (
                          <Power className='h-4 w-4' />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setSelectedListing(listing)
                          setUpdateDialogOpen(true)
                        }}
                        title='Edit'
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setSelectedListing(listing)
                          setDeleteDialogOpen(true)
                        }}
                        title='Delete'
                      >
                        <Trash2 className='text-destructive h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Update Dialog */}
      {selectedListing && (
        <UpdateListingDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          listing={selectedListing}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
