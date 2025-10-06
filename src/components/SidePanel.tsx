'use client'

// Packages:
import React from 'react'
import { cn } from '@/lib/utils'

// Typescript:
export enum LogDownloadStatus {
  DOWNLOADING = 0,
  DOWNLOADED = 1,
  FAILED_TO_DOWNLOAD = 2,
}

import type { MOSDACLogData, MOSDACLog } from '../pages/api/log'
import { MOSDACImageMode } from '../pages/api/history'

// Constants:
export const ANIMATION_SPEEDS = [
  {
    id: '3mps',
    label: '3m/s',
    value: 50,
  },
  {
    id: '6mps',
    label: '6m/s',
    value: 100,
  },
  {
    id: '15mps',
    label: '15m/s',
    value: 250,
  },
  {
    id: '30mps',
    label: '30m/s',
    value: 500,
  },
  {
    id: '1hps',
    label: '1h/s',
    value: 1000,
  },
]

// Components:
import LayersCombobox, { Layer } from '@/components/LayersCombobox'
import HistoryCombobox from '@/components/HistoryCombobox'
import LegendsCombobox from '@/components/ModesCombobox'
import { Slider } from '@/components/ui/slider'
import AnimationCombobox from '@/components/AnimationCombobox'
import SettingsDialog from '@/components/SettingsDialog'

// Functions:
const SidePanel = ({
  useSmallView,
  toggleSmallViewDialog,
  layers,
  setLayers,
  selectedLog,
  mode,
  opacity,
  setOpacity,
  modeFetchingStatus,
  logs,
  reversedLogs,
  onLogSelect,
  historicalLogsFetchingStatus,
  isHistoryOn,
  setIsHistoryOn,
  logDownloadStatus,
  averageLogDownloadSpeed,
  selectedLogIndex,
  animationRangeIndices,
  setAnimationRangeIndices,
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
  isAnimationOn,
  setIsAnimationOn,
  selectedAnimationSpeed,
  setSelectedAnimationSpeed,
  onModeSelect,
  repeat,
  setRepeat,
  repeatRef,
  startLongPress,
  stopLongPress,
  isLongPressing,
  pause,
  play,
  stop,
}: {
  useSmallView: boolean
  toggleSmallViewDialog: (state: boolean) => Promise<void>
  layers: Layer[]
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>
  selectedLog: MOSDACLog | null
  mode: MOSDACImageMode
  opacity: number
  setOpacity: React.Dispatch<React.SetStateAction<number>>
  modeFetchingStatus: Map<MOSDACImageMode, number | boolean>
  logs: MOSDACLogData
  reversedLogs: MOSDACLogData
  onLogSelect: (log: MOSDACLog, logIndex: number) => Promise<void>
  historicalLogsFetchingStatus: Map<string, number | boolean>
  isHistoryOn: boolean
  setIsHistoryOn: React.Dispatch<React.SetStateAction<boolean>>
  logDownloadStatus: Map<string, LogDownloadStatus>
  averageLogDownloadSpeed: number
  selectedLogIndex: number
  animationRangeIndices: [number, number]
  setAnimationRangeIndices: React.Dispatch<React.SetStateAction<[number, number]>>
  layerFetchingStatus: Map<Layer, boolean>
  onWindDirectionLayerSelect: () => Promise<void>
  onWindHeatmapLayerSelect: () => Promise<void>
  onFireSmokeLayerSelect: () => Promise<void>
  onFireSmokeHeatmapLayerSelect: () => Promise<void>
  onHeavyRainLayerSelect: () => Promise<void>
  onHeavyRainForecastLayerSelect: () => Promise<void>
  onCloudburstForecastLayerSelect: () => Promise<void>
  onRipCurrentForecastLayerSelect: () => Promise<void>
  onSnowLayerSelect: () => Promise<void>
  isAnimationOn: boolean
  setIsAnimationOn: React.Dispatch<React.SetStateAction<boolean>>
  selectedAnimationSpeed: typeof ANIMATION_SPEEDS[number]
  setSelectedAnimationSpeed: React.Dispatch<React.SetStateAction<typeof ANIMATION_SPEEDS[number]>>
  onModeSelect: (newMode: MOSDACImageMode) => Promise<void>
  repeat: boolean
  setRepeat: React.Dispatch<React.SetStateAction<boolean>>
  repeatRef: React.MutableRefObject<boolean>
  startLongPress: (direction: 'forward' | 'backward', _selectedLogIndex: number) => Promise<void>
  stopLongPress: () => void
  isLongPressing: 'forward' | 'backward' | null
  pause: () => void
  play: () => Promise<void>
  stop: () => void
}) => {
  // Return:
  return (
    <div
      className={cn(
        'z-[1001] flex justify-center items-center flex-col gap-2 w-48 p-3 bg-white rounded-md',
        !useSmallView && 'absolute left-3 top-3',
      )}
    >
      <LayersCombobox
        useSmallView={useSmallView}
        toggleSmallViewDialog={toggleSmallViewDialog}
        layers={layers}
        setLayers={setLayers}
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
      <HistoryCombobox
        useSmallView={useSmallView}
        toggleSmallViewDialog={toggleSmallViewDialog}
        logs={logs}
        selectedLog={selectedLog}
        onSelect={onLogSelect}
        historicalLogsFetchingStatus={historicalLogsFetchingStatus}
        isHistoryOn={isHistoryOn}
        setIsHistoryOn={setIsHistoryOn}
      />
      <AnimationCombobox
        useSmallView={useSmallView}
        toggleSmallViewDialog={toggleSmallViewDialog}
        reversedLogs={reversedLogs}
        logDownloadStatus={logDownloadStatus}
        averageLogDownloadSpeed={averageLogDownloadSpeed}
        isAnimationOn={isAnimationOn}
        setIsAnimationOn={setIsAnimationOn}
        selectedReversedLogIndex={logs.length - 1 - selectedLogIndex}
        onLogSelect={onLogSelect}
        animationRangeIndices={animationRangeIndices}
        setAnimationRangeIndices={setAnimationRangeIndices}
        selectedAnimationSpeed={selectedAnimationSpeed}
        setSelectedAnimationSpeed={setSelectedAnimationSpeed}
        repeat={repeat}
        setRepeat={setRepeat}
        repeatRef={repeatRef}
        startLongPress={startLongPress}
        stopLongPress={stopLongPress}
        isLongPressing={isLongPressing}
        pause={pause}
        play={play}
        stop={stop}
      />
      <LegendsCombobox
        useSmallView={useSmallView}
        toggleSmallViewDialog={toggleSmallViewDialog}
        selectedMode={mode}
        onSelect={onModeSelect}
        modeFetchingStatus={modeFetchingStatus}
      />
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
      <SettingsDialog
        useSmallView={useSmallView}
        toggleSmallViewDialog={toggleSmallViewDialog}
      />
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
