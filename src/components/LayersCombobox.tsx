// Packages:
import React, { useMemo, useState } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

// Assets:
import { BrickWallFireIcon, CheckIcon, CloudHailIcon, FlameIcon, ShellIcon, SnowflakeIcon, WavesIcon, WindIcon } from 'lucide-react'

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

// Functions:
const LayersCombobox = () => {
  // Memo:
  const LAYERS = useMemo(() => [
    { id: 'wind-direction', icon: <WindIcon className='text-inherit transition-all' />, name: 'Wind Direction' },
    { id: 'wind-heatmap', icon: <BrickWallFireIcon className='text-inherit transition-all' />, name: 'Wind Heatmap' },
    { id: 'fire-smoke', icon: <FlameIcon className='text-inherit transition-all' />, name: 'Fire & Smoke' },
    { id: 'cloudburst-heavy-rain', icon: <CloudHailIcon className='text-inherit transition-all' />, name: 'Cloudburst/Heavy Rain' },
    { id: 'rip-current-forecast', icon: <WavesIcon className='text-inherit transition-all' />, name: 'Rip Current (Forecast)' },
    { id: 'snow', icon: <SnowflakeIcon className='text-inherit transition-all' />, name: 'Snow' },
    { id: 'cyclone-track', icon: <ShellIcon className='text-inherit transition-all' />, name: 'Cyclone Track' },
  ], [])

  // State:
  const [layers, setLayers] = useState<string[]>([])
  const [layersPopoverOpen, setLayersPopoverOpen] = useState(false)

  // Return:
  return (
    <Popover open={layersPopoverOpen} onOpenChange={setLayersPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' className={cn('relative w-full cursor-pointer', layersPopoverOpen && '!bg-zinc-200')}>
          {
            layers.length > 0 && (
              <div className='absolute -top-2 -right-2 z-10 flex justify-center items-center w-4 h-4 text-xs text-[10px] text-white bg-blue-500 rounded-full'>{layers.length}</div>
            )
          }
          Layers
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('z-[1001] w-2xs p-0', `${geistSans.className} font-sans`)} align='start' side='left' sideOffset={16}>
        <Command>
          <CommandList>
            <CommandGroup>
              {LAYERS.map(layer => (
                <CommandItem
                  key={layer.id}
                  value={layer.id}
                  onSelect={currentValue => {
                    if (layers.includes(currentValue)) {
                      setLayers(_layers => _layers.filter(layerID => layerID !== layer.id))
                    } else {
                      setLayers(_layers => [...layers, layer.id])
                    }
                  }}
                  className='justify-between cursor-pointer'
                >
                  <div className={cn('flex justify-center items-center gap-2 transition-all', layers.includes(layer.id) && 'text-blue-500')}>
                    {layer.icon}
                    <span className='text-sm font-medium'>
                      {layer.name}
                    </span>
                  </div>
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      layers.includes(layer.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Exports:
export default LayersCombobox
