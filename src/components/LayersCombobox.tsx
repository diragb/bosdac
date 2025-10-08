// Packages:
import React, { useMemo, useState } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

// Typescript:
export enum Layer {
  WIND_DIRECTION = 'WIND_DIRECTION',
  WIND_HEATMAP = 'WIND_HEATMAP',
  FIRE_SMOKE = 'FIRE_SMOKE',
  FIRE_SMOKE_HEATMAP = 'FIRE_SMOKE_HEATMAP',
  HEAVY_RAIN = 'HEAVY_RAIN',
  HEAVY_RAIN_FORECAST = 'HEAVY_RAIN_FORECAST',
  CLOUDBURST_FORECAST = 'CLOUDBURST_FORECAST',
  RIP_CURRENT_FORECAST = 'RIP_CURRENT_FORECAST',
  SNOW = 'SNOW',
  CYCLONE_TRACK = 'CYCLONE_TRACK',
}

// Assets:
import {
  BrickWallFireIcon,
  CheckIcon,
  CloudAlertIcon,
  CloudRainIcon,
  CloudRainWindIcon,
  FlameIcon,
  FlameKindlingIcon,
  FrownIcon,
  Loader2Icon,
  SnowflakeIcon,
  WavesIcon,
  WindIcon,
} from 'lucide-react'

// Constants:
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// Components:
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { ScrollArea } from './ui/scroll-area'

// Functions:
const LayersCommand = ({
  LAYERS,
  onLayerSelect,
  layers,
  layerFetchingStatus,
}: {
  LAYERS: {
    id: Layer
    icon: React.JSX.Element
    name: string
  }[]
  onLayerSelect: (currentValue: string, layer: {
    id: Layer
    icon: React.JSX.Element
    name: string
  }) => void
  layers: Layer[]
  layerFetchingStatus: Map<Layer, boolean>
}) => (
  <Command>
    <CommandList>
      <CommandGroup>
        <ScrollArea className='h-52'>
          {LAYERS.map(layer => (
            <CommandItem
              key={layer.id}
              value={layer.id}
              onSelect={value => onLayerSelect(value, layer)}
              className='justify-between cursor-pointer'
            >
              <div className={cn('flex justify-center items-center gap-2 transition-all', layers.includes(layer.id) && 'text-blue-500')}>
                {layer.icon}
                <span className='text-sm font-medium'>
                  {layer.name}
                </span>
              </div>
              {
                layerFetchingStatus.has(layer.id) ? (
                  <>
                    {
                      layerFetchingStatus.get(layer.id) ? (
                        <Loader2Icon className='size-3 animate-spin' />
                      ) : (
                        <span title='Something went wrong..'>
                          <FrownIcon className='size-3 text-rose-500' />
                        </span>
                      )
                    }
                  </>
                ) : (
                  <CheckIcon
                    className={cn(
                      'size-4',
                      layers.includes(layer.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                )
              }
            </CommandItem>
          ))}
        </ScrollArea>
      </CommandGroup>
    </CommandList>
  </Command>
)

const LayersCombobox = ({
  useSmallView,
  toggleSmallViewDialog,
  layers,
  setLayers,
  layerFetchingStatus,
  onWindDirectionLayerSelect,
  onWindHeatmapLayerSelect,
  onFireSmokeLayerSelect,
  onFireSmokeHeatmapLayerSelect,
  onHeavyRainLayerSelect,
  onHeavyRainForecastLayerSelect,
  onCloudburstForecastLayerSelect,
  onRipCurrentForecastLayerSelect,
  onSnowLayerSelect,
}: {
  useSmallView: boolean
  toggleSmallViewDialog: (state: boolean) => Promise<void>
  layers: Layer[]
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>
  layerFetchingStatus: Map<Layer, boolean>
  onWindDirectionLayerSelect: () => void
  onWindHeatmapLayerSelect: () => void
  onFireSmokeLayerSelect: () => void
  onFireSmokeHeatmapLayerSelect: () => void
  onHeavyRainLayerSelect: () => void
  onHeavyRainForecastLayerSelect: () => void
  onCloudburstForecastLayerSelect: () => void
  onRipCurrentForecastLayerSelect: () => void
  onSnowLayerSelect: () => void
}) => {
  // Memo:
  const LAYERS = useMemo(() => [
    { id: Layer.WIND_DIRECTION, icon: <WindIcon className='text-inherit transition-all' />, name: 'Wind Direction' },
    { id: Layer.WIND_HEATMAP, icon: <BrickWallFireIcon className='text-inherit transition-all' />, name: 'Wind Heatmap' },
    { id: Layer.FIRE_SMOKE, icon: <FlameIcon className='text-inherit transition-all' />, name: 'Fire & Smoke' },
    { id: Layer.FIRE_SMOKE_HEATMAP, icon: <FlameKindlingIcon className='text-inherit transition-all' />, name: 'Fire & Smoke Heatmap' },
    { id: Layer.HEAVY_RAIN, icon: <CloudRainIcon className='text-inherit transition-all' />, name: 'Heavy Rain' },
    { id: Layer.HEAVY_RAIN_FORECAST, icon: <CloudRainWindIcon className='text-inherit transition-all' />, name: 'Heavy Rain Forecast' },
    { id: Layer.CLOUDBURST_FORECAST, icon: <CloudAlertIcon className='text-inherit transition-all' />, name: 'Cloudburst Forecast' },
    { id: Layer.RIP_CURRENT_FORECAST, icon: <WavesIcon className='text-inherit transition-all' />, name: 'Rip Current Forecast' },
    { id: Layer.SNOW, icon: <SnowflakeIcon className='text-inherit transition-all' />, name: 'Snow' },
    // { id: Layer.CYCLONE_TRACK, icon: <ShellIcon className='text-inherit transition-all' />, name: 'Cyclone Track' },
  ], [])

  // State:
  const [layersPopoverOpen, setLayersPopoverOpen] = useState(false)

  // Functions:
  const onLayerSelect = (currentValue: string, layer: typeof LAYERS[number]) => {
    if (layers.includes(currentValue as Layer)) {
      setLayers(_layers => _layers.filter(layerID => layerID !== layer.id))
    } else {
      setLayers(_layers => [..._layers, layer.id])

      switch (layer.id) {
        case Layer.WIND_DIRECTION:
          onWindDirectionLayerSelect()
          break
        case Layer.WIND_HEATMAP:
          onWindHeatmapLayerSelect()
          break
        case Layer.FIRE_SMOKE:
          onFireSmokeLayerSelect()
          break
        case Layer.FIRE_SMOKE_HEATMAP:
          onFireSmokeHeatmapLayerSelect()
          break
        case Layer.HEAVY_RAIN:
          onHeavyRainLayerSelect()
          break
        case Layer.HEAVY_RAIN_FORECAST:
          onHeavyRainForecastLayerSelect()
          break
        case Layer.CLOUDBURST_FORECAST:
          onCloudburstForecastLayerSelect()
          break
        case Layer.RIP_CURRENT_FORECAST:
          onRipCurrentForecastLayerSelect()
          break
        case Layer.SNOW:
          onSnowLayerSelect()
          break
        default:
          break
      }
    }
  }

  // Return:
  return (
    <>
      {
        useSmallView ? (
          <Dialog
            open={layersPopoverOpen}
            onOpenChange={async _open => {
              if (_open) {
                await toggleSmallViewDialog(_open)
                setLayersPopoverOpen(_open)
              } else {
                setLayersPopoverOpen(_open)
                await toggleSmallViewDialog(_open)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant='outline' className={cn('relative w-full cursor-pointer', layersPopoverOpen && '!bg-zinc-200')}>
                {
                  layers.length > 0 && (
                    <div className='absolute -top-2 -right-2 z-10 flex justify-center items-center w-4 h-4 text-xs text-[10px] text-white bg-blue-500 rounded-full'>{layers.length}</div>
                  )
                }
                Layers
              </Button>
            </DialogTrigger>
            <DialogContent hideOverlay showCloseButton={false} className={cn('z-[1001] p-0', `${geistSans.className} font-sans`)}>
              <VisuallyHidden>
                <DialogTitle>Layers</DialogTitle>
                <DialogDescription>Select a layer from the list below</DialogDescription>
              </VisuallyHidden>
              <LayersCommand
                LAYERS={LAYERS}
                onLayerSelect={onLayerSelect}
                layers={layers}
                layerFetchingStatus={layerFetchingStatus}
              />
            </DialogContent>
          </Dialog>
        ) : (
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
              <LayersCommand
                LAYERS={LAYERS}
                onLayerSelect={onLayerSelect}
                layers={layers}
                layerFetchingStatus={layerFetchingStatus}
              />
            </PopoverContent>
          </Popover>
        )
      }
    </>
  )
}

// Exports:
export default LayersCombobox
