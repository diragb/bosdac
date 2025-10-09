// Packages:
import React, { useContext } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

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
} from '@/components/ui/dialog'

// Context:
import UtilitiesContext from '@/context/UtilitiesContext'

// Functions:
const MOSDACDownDialog = () => {
  // Constants:
  const {
    isMOSDACDownDialogOpen,
    setIsMOSDACDownDialogOpen,
  } = useContext(UtilitiesContext)

  // Return:
  return (
    <Dialog open={isMOSDACDownDialogOpen} onOpenChange={setIsMOSDACDownDialogOpen}>
      <DialogOverlay className='z-[1001]' />
      <DialogContent className={cn('z-[1001]', `${geistSans.className} font-sans`)}>
        <DialogHeader>
          <DialogTitle>MOSDAC servers are down</DialogTitle>
          <DialogDescription>
            We get our data from <a className='underline font-medium' href='https://mosdac.gov.in/live/' target='_blank'>MOSDAC</a>, and it looks like their server is down.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

// Exports:
export default MOSDACDownDialog
