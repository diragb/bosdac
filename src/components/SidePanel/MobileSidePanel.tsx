// Packages:
import React, { useContext } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

// Assets:
import { BanIcon, CheckIcon, LogsIcon } from 'lucide-react'

// Constants:
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// Components:
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import _SidePanel from '@/components/SidePanel/SidePanelPrimitive'
import { Button } from '@/components/ui/button'

// Context:
import UtilitiesContext from '@/context/UtilitiesContext'
import AnimationContext from '@/context/AnimationContext'

// Functions:
const MobileSidePanel = () => {
  // Constants:
  const {
    isSidePanelPopoverOpen,
    setIsSidePanelPopoverOpen,
    isSmallViewDialogRendering,
    isSmallViewDialogVisible,
    toggleSmallViewDialog,
  } = useContext(UtilitiesContext)
  const {
    setShowTimelapseRecordingControls,
    isSelectingTilesToRecord,
    setIsSelectingTilesToRecord,
    setAnimationPopoverOpen,
  } = useContext(AnimationContext)

  // Return:
  return (
    <>
      {
        isSelectingTilesToRecord && (
          <>
            <div className='absolute top-0 left-0 z-[1001] flex items-center justify-center gap-2 p-2'>
              <Button
                size='sm'
                className='text-xs'
                variant='secondary'
                onClick={async () => {
                  setShowTimelapseRecordingControls(false)
                  setIsSelectingTilesToRecord(false)
                  setIsSidePanelPopoverOpen(true)
                  await toggleSmallViewDialog(true)
                  setAnimationPopoverOpen(true)
                }}
              >
                <BanIcon className='size-3.5' />
                Cancel
              </Button>
              <Button
                size='sm'
                className='text-xs'
                onClick={async () => {
                  setIsSelectingTilesToRecord(false)
                  setIsSidePanelPopoverOpen(true)
                  await toggleSmallViewDialog(true)
                  setAnimationPopoverOpen(true)
                }}
              >
                <CheckIcon className='size-3.5' />
                Done
              </Button>
            </div>
            <div className='absolute bottom-10 left-0 z-[1001] w-screen p-2 text-sm text-center bg-zinc-50'>
              <span className='font-semibold'>Note</span>: Dragging and zooming is disabled in this mode. Please press cancel to enable those features.
            </div>
          </>
        )
      }
      <Popover open={isSidePanelPopoverOpen} onOpenChange={setIsSidePanelPopoverOpen}>
        <PopoverTrigger asChild>
          <Button size='icon' className={cn('absolute left-3 top-3 z-[1001] cursor-pointer transition-all', isSelectingTilesToRecord && 'z-[-1]', isSidePanelPopoverOpen && 'text-blue-400')}>
            <LogsIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn('z-[1001] w-48 p-0', `${geistSans.className} font-sans`)} align='start' side='left' sideOffset={16}>
          {
            isSmallViewDialogRendering && (
              <div
                className={cn(
                  'absolute -left-16 -top-3 z-[1002] w-screen h-screen bg-black/75 transition-all',
                  isSmallViewDialogVisible ? 'opacity-100' : 'opacity-0',
                )}
                onClick={() => toggleSmallViewDialog(false)}
              />
            )
          }
          <_SidePanel />
        </PopoverContent>
      </Popover>
    </>
  )
}

// Exports:
export default MobileSidePanel
