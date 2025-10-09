'use client'

// Packages:
import React, { useContext } from 'react'
import { cn } from '@/lib/utils'

// Typescript:
export enum LogDownloadStatus {
  DOWNLOADING = 0,
  DOWNLOADED = 1,
  FAILED_TO_DOWNLOAD = 2,
}
// Constants:

// Components:
import LayersCombobox from '@/components/LayersCombobox'
import HistoryCombobox from '@/components/HistoryCombobox'
import LegendsCombobox from '@/components/ModesCombobox'
import { Slider } from '@/components/ui/slider'
import AnimationCombobox from '@/components/AnimationCombobox'
import SettingsDialog from '@/components/SettingsDialog'

// Context:
import MapContext from '@/context/MapContext'
import UtilitiesContext from '@/context/UtilitiesContext'

// Functions:
const SidePanel = () => {
  // Constants:
  const { useSmallView } = useContext(UtilitiesContext)
  const {
    logs,
    selectedLogIndex,
    opacity,
    setOpacity,
  } = useContext(MapContext)

  // Return:
  return (
    <div
      className={cn(
        'z-[1001] flex justify-center items-center flex-col gap-2 w-48 p-3 bg-white rounded-md',
        !useSmallView && 'absolute left-3 top-3',
      )}
    >
      <LayersCombobox />
      <HistoryCombobox />
      <AnimationCombobox selectedReversedLogIndex={logs.length - 1 - selectedLogIndex} />
      <LegendsCombobox />
      <div className='flex flex-col gap-2.5 w-full p-2 pb-2.5 border bg-secondary rounded-md'>
        <div className='flex items-center justify-between w-full'>
          <span className='text-xs font-semibold'>Opacity</span>
          <span className='text-xs font-medium'>{(opacity * 100).toFixed(0)}%</span>
        </div>
        <Slider
          defaultValue={[opacity * 100]}
          max={100}
          step={1}
          onValueChange={value => setOpacity(value[0] / 100)}
        />
      </div>
      <SettingsDialog />
      <div
        className='flex items-center justify-center w-full h-8 p-2 text-xs text-muted-foreground bg-accent rounded-md overflow-hidden transition-all'
      >
        Made by diragb
      </div>
      <div className='relative flex items-center justify-center gap-1 w-full h-8 rounded-md overflow-hidden'>
        <div
          className='group flex items-center justify-center w-1/2 h-full ml-0.5 bg-primary rounded-md cursor-pointer transition-all hover:bg-blue-500'
          onClick={() => {
            window.open('https://github.com/diragb', '_blank')
          }}
        >
          <div
            className='size-3.5 bg-cover bg-center bg-no-repeat invert-100 transition-all'
            style={{  
              backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg)',
            }}
          />
        </div>
        <div
          className='group flex items-center justify-center w-1/2 h-full mr-0.5 bg-primary rounded-md cursor-pointer transition-all hover:bg-blue-500'
          onClick={() => {
            window.open('https://x.com/intent/user?screen_name=diragb', '_blank')
          }}
        >
          <div
            className='size-3.5 bg-cover bg-center bg-no-repeat transition-all'
            style={{  
              backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Exports:
export default SidePanel
