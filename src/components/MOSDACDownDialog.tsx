// Packages:
import React from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

// Typescript:
import type { DialogProps } from '@radix-ui/react-dialog'

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
  DialogTitle,
} from '@/components/ui/dialog'

// Functions:
const MOSDACDownDialog = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean
  onOpenChange: DialogProps['onOpenChange']
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className={cn(`${geistSans.className} font-sans`)}>
      <DialogHeader>
        <DialogTitle>MOSDAC servers are down</DialogTitle>
        <DialogDescription>
          We get our data from <a className='underline font-medium' href='https://mosdac.gov.in/live/' target='_blank'>MOSDAC</a>, and it looks like their server is down.
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
)

// Exports:
export default MOSDACDownDialog
