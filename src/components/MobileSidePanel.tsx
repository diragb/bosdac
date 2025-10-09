// Packages:
import React, { useContext } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

// Assets:
import { LogsIcon } from 'lucide-react'

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
import SidePanel, { type SidePanelProps } from '@/components/SidePanel'
import { Button } from '@/components/ui/button'

// Context:
import UtilitiesContext from '@/context/UtilitiesContext'

// Functions:
const MobileSidePanel = ({
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
}: SidePanelProps) => {
  // Constants:
  const {
    isSidePanelPopoverOpen,
    setIsSidePanelPopoverOpen,
    isSmallViewDialogRendering,
    isSmallViewDialogVisible,
    toggleSmallViewDialog,
  } = useContext(UtilitiesContext)

  // Return:
  return (
    <Popover open={isSidePanelPopoverOpen} onOpenChange={setIsSidePanelPopoverOpen}>
      <PopoverTrigger asChild>
        <Button size='icon' className={cn('absolute left-3 top-3 z-[1001] cursor-pointer transition-all', isSidePanelPopoverOpen && 'text-blue-400')}>
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
        <SidePanel
          layerFetchingStatus={layerFetchingStatus}
          onWindDirectionLayerSelect={onWindDirectionLayerSelect}
          onWindHeatmapLayerSelect={onWindHeatmapLayerSelect}
          onFireSmokeLayerSelect={onFireSmokeLayerSelect}
          onFireSmokeHeatmapLayerSelect={onFireSmokeHeatmapLayerSelect}
          onHeavyRainLayerSelect={onHeavyRainLayerSelect}
          onHeavyRainForecastLayerSelect={onHeavyRainForecastLayerSelect}
          onCloudburstForecastLayerSelect={onCloudburstForecastLayerSelect}
          onRipCurrentForecastLayerSelect={onRipCurrentForecastLayerSelect}
          onSnowLayerSelect={onSnowLayerSelect}
        />
      </PopoverContent>
    </Popover>
  )
}

// Exports:
export default MobileSidePanel
