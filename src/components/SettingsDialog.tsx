// Packages:
import React, { useCallback, useEffect, useState } from 'react'
import { formatBytes, getIndexedDBQuota, getIndexedDBSize } from '@/lib/indexeddb'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

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
  DialogHeader,
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
} from '@/components/ui/alert-dialog'
import localforage from 'localforage'

// Functions:
const SettingsDialog = () => {
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
    loadLocalQuotaInfo()
  }, [loadLocalQuotaInfo])
  // }, [])


  // Return:
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className={cn('relative w-full cursor-pointer', isOpen && '!bg-zinc-200')}>
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className={cn('!max-w-screen !w-[600px] p-4', `${geistSans.className} font-sans`)}>
        <DialogPrimitive.Close
          data-slot='dialog-close'
          className='ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-6'
        >
          <XIcon />
          <span className='sr-only'>Close</span>
        </DialogPrimitive.Close>
        <DialogHeader>
          <DialogTitle className='text-2xl'>Settings</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between w-full'>
              <span className='text-lg font-semibold'>Storage</span>
              <span className='text-lg font-medium text-zinc-500'>{formatBytes(localQuota.usage)} of {formatBytes(localQuota.available)} used</span>
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
              <AlertDialogContent className={cn(`${geistSans.className} font-sans`)}>
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
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearLocallyCachedImages}>Continue</AlertDialogAction>
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
