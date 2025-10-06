// Packages:
import React, { useCallback, useEffect, useState } from 'react'
import { formatBytes, getIndexedDBQuota, getIndexedDBSize } from '@/lib/indexeddb'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import localforage from 'localforage'

// Assets:
import { XIcon } from 'lucide-react'

// Constants:
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// Components:
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from './ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

// Functions:
const SettingsDialog = ({
  useSmallView,
  toggleSmallViewDialog,
}: {
  useSmallView: boolean
  toggleSmallViewDialog: (state: boolean) => Promise<void>
}) => {
  // State:
  const [isOpen, setIsOpen] = useState(false)
  const [localQuota, setLocalQuota] = useState({
    size: 0,
    quota: 0,
    usage: 0,
    available: 0,
    percentUsed: 0,
  })

  // Functions:
  const loadLocalQuotaInfo = useCallback(async () => {
    try {
      const databaseSize = await getIndexedDBSize('localforage')
      const quotaInfo = await getIndexedDBQuota()

      setLocalQuota({
        size: databaseSize,
        quota: quotaInfo.quota,
        usage: quotaInfo.usage,
        available: quotaInfo.available,
        percentUsed: quotaInfo.percentUsed,
      })
    } catch (error) {
      console.error('Error getting database size:', error)
      throw error
    }
  }, [])

  const clearLocallyCachedImages = async () => {
    await localforage.clear()
    await loadLocalQuotaInfo()
  }

  // Effects:
  useEffect(() => {
    if (isOpen) loadLocalQuotaInfo()
  }, [isOpen, loadLocalQuotaInfo])

  // Return:
  return (
    <Dialog
      open={isOpen}
      onOpenChange={async _open => {
        if (useSmallView) {
          if (_open) {
            await toggleSmallViewDialog(_open)
            setIsOpen(_open)
          } else {
            setIsOpen(_open)
            await toggleSmallViewDialog(_open)
          }
        } else setIsOpen(_open)
      }}
    >
      <DialogTrigger asChild>
        <Button variant='outline' className={cn('relative w-full cursor-pointer', isOpen && '!bg-zinc-200')}>
          Settings
        </Button>
      </DialogTrigger>
      {!useSmallView && <DialogOverlay className='z-[1001]' />}
      <DialogContent
        hideOverlay
        showCloseButton={false}
        className={cn(
          'z-[1001]',
          useSmallView ? '!w-80 p-4' : '!max-w-screen !w-[600px] p-4',
          `${geistSans.className} font-sans`,
        )}
      >
        <DialogPrimitive.Close
          data-slot='dialog-close'
          className='ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-6 cursor-pointer'
        >
          <XIcon />
          <span className='sr-only'>Close</span>
        </DialogPrimitive.Close>
        <DialogHeader>
          <DialogTitle className={cn(useSmallView ? 'text-lg' : 'text-2xl')}>Settings</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Feel free to modify any of the settings below</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className='flex flex-col'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between w-full'>
              <span className={cn(useSmallView ? 'text-sm' : 'text-lg', 'font-semibold')}>Storage</span>
              <span className={cn(useSmallView ? 'text-sm' : 'text-lg', 'font-medium text-zinc-500')}>{formatBytes(localQuota.usage)} of {formatBytes(localQuota.available)} used</span>
            </div>
            <div className='flex gap-1 w-full h-10 bg-secondary border-2 border-border rounded-md overflow-hidden'>
              <div
                className='flex justify-center items-center min-w-0.5 h-10 bg-rose-500 transition-all'
                style={{
                  width: `${localQuota.percentUsed}%`,
                }}
              >
                {localQuota.percentUsed > 25 && <span className='font-semibold text-rose-950'>{formatBytes(localQuota.usage)}</span>}
              </div>
              <div
                className='flex justify-center items-center h-10 transition-all'
                style={{
                  width: `${100 - localQuota.percentUsed}%`,
                }}
              >
                {localQuota.percentUsed < (100 - 25) && <span className='font-semibold'>{formatBytes(localQuota.available)}</span>}
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size='lg' variant='destructive' className='cursor-pointer'>
                  Clear Cache
                </Button>
              </AlertDialogTrigger>
              <AlertDialogOverlay className='z-[1002]' />
              <AlertDialogContent className={cn('z-[1002]', `${geistSans.className} font-sans`)} hideOverlay>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone, and will permanently delete the cached images present on your system.
                    <br />
                    <br />
                    Reusing BOSDAC will re-download the same content again, which may take a long time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                  <AlertDialogAction className='cursor-pointer' onClick={clearLocallyCachedImages}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Exports:
export default SettingsDialog
