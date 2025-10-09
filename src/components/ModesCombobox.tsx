// Packages:
import React, { useContext, useMemo, useState } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

// Typescript:
import { MOSDACImageMode } from '@/pages/api/history'

// Assets:
import { CheckIcon, FrownIcon, Loader2Icon } from 'lucide-react'

// Constants:
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// Components:
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

// Context:
import UtilitiesContext from '@/context/UtilitiesContext'
import MapContext from '@/context/MapContext'

// Functions:
const ModeCommand = ({
  MODES,
  selectedMode,
  onSelect,
  modeFetchingStatus,
}: {
  MODES: {
    id: MOSDACImageMode
    name: string
    className: string
  }[]
  selectedMode: MOSDACImageMode
  onSelect: (mode: MOSDACImageMode) => void
  modeFetchingStatus: Map<string, number | boolean>
}) => (
  <Command>
    <CommandList>
      <CommandGroup>
        {MODES.map(mode => (
          <CommandItem
            key={mode.id}
            value={mode.id}
            onSelect={currentValue => {
              if (selectedMode !== currentValue) onSelect(currentValue as MOSDACImageMode)
            }}
            className='justify-between cursor-pointer'
          >
            <div className={cn('flex justify-center items-center gap-2 transition-all', selectedMode === mode.id && 'text-blue-500')}>
              <div
                className={cn(
                  'h-3 w-8 rounded-full',
                  mode.className,
                )}
              />
              <span className='text-sm font-medium'>
                {mode.name}
              </span>
            </div>
            {
                modeFetchingStatus.has(mode.id) ? (
                  <>
                    {
                      modeFetchingStatus.get(mode.id) === false ? (
                        <span title='Something went wrong..'>
                          <FrownIcon className='size-3 text-rose-500' />
                        </span>
                      ) : (
                        <div className='flex items-center justify-center gap-1'>
                          <span className='text-xs font-medium'>{(((modeFetchingStatus.get(mode.id) as number | undefined) ?? 0) * 100).toFixed(0)}%</span>
                          <Loader2Icon className='size-3 animate-spin' />
                        </div>
                      )
                    }
                  </>
                ) : (
                  <CheckIcon
                    className={cn(
                      'size-4',
                      selectedMode === mode.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                )
              }
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  </Command>
)

const ModeCombobox = () => {
  // Constants:
  const {
    useSmallView,
    toggleSmallViewDialog,  
  } = useContext(UtilitiesContext)
  const {
    mode: selectedMode,
    onModeSelect: onSelect,
    modeFetchingStatus,
  } = useContext(MapContext)

  // State:
  const [legendsPopoverOpen, setLegendsPopoverOpen] = useState(false)

  // Memo:
  const MODES = useMemo(() => [
    { id: MOSDACImageMode.GREYSCALE, className: 'bg-gray-400', name: 'Greyscale' },
    { id: MOSDACImageMode.REDBLUE, className: 'bg-gradient-to-r from-blue-500 to-red-500', name: 'Red-Blue' },
    { id: MOSDACImageMode.RAINBOW, className: 'bg-[linear-gradient(90deg,#ff0000_0%,#ffae00_20%,#ffff00_40%,#00ff00_60%,#00e7ff_80%,#0000ff_90%,#000088_100%)]', name: 'Rainbow' },
    { id: MOSDACImageMode.SST_36, className: 'bg-[linear-gradient(90deg,#ff0000_0%,#ffae00_35%,#ffff00_55%,#00ff00_65%,#00e7ff_80%,#0000ff_100%)]', name: 'SST 36' },
    { id: MOSDACImageMode.FERRET, className: 'bg-[linear-gradient(90deg,#cc0000_0%,#ff0000_15%,#ff7b00_25%,#ffff00_35%,#00ff00_45%,#00c8c8_55%,#0060ff_65%,#9900ff_75%,#550077_100%)]', name: 'Ferret' },
    { id: MOSDACImageMode.NHC, className: 'bg-[linear-gradient(90deg,#ff0000_0%,#ffae00_20%,#ffff00_40%,#00ff00_60%,#00e7ff_80%,#0000ff_90%,#000088_100%)]', name: 'NHC' },
  ], [])

  // Return:
  return (
    <>
      {
        useSmallView ? (
          <Dialog
            open={legendsPopoverOpen} 
            onOpenChange={async _open => {
              if (_open) {
                await toggleSmallViewDialog(_open)
                setLegendsPopoverOpen(_open)
              } else {
                setLegendsPopoverOpen(_open)
                await toggleSmallViewDialog(_open)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant='outline' className={cn('relative w-full cursor-pointer', legendsPopoverOpen && '!bg-zinc-200')}>
                <div 
                  className={cn(
                    'absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all',
                    MODES.find(mode => mode.id === selectedMode)?.className,
                  )}
                />
                Mode
              </Button>
            </DialogTrigger>
            <DialogContent hideOverlay showCloseButton={false} className={cn('z-[1003] p-0', `${geistSans.className} font-sans`)}>
              <VisuallyHidden>
                <DialogTitle>Layers</DialogTitle>
                <DialogDescription>Select a layer from the list below</DialogDescription>
              </VisuallyHidden>
              <ModeCommand
                MODES={MODES}
                selectedMode={selectedMode}
                onSelect={onSelect}
                modeFetchingStatus={modeFetchingStatus}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Popover open={legendsPopoverOpen} onOpenChange={setLegendsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant='outline' className={cn('relative w-full cursor-pointer', legendsPopoverOpen && '!bg-zinc-200')}>
                <div 
                  className={cn(
                    'absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all',
                    MODES.find(mode => mode.id === selectedMode)?.className,
                  )}
                />
                Mode
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn('z-[1001] w-64 p-0', `${geistSans.className} font-sans`)} align='start' side='left' sideOffset={16}>
              <ModeCommand
                MODES={MODES}
                selectedMode={selectedMode}
                onSelect={onSelect}
                modeFetchingStatus={modeFetchingStatus}
              />
            </PopoverContent>
          </Popover>
        )
      }
    </>
  )
}

// Exports:
export default ModeCombobox
