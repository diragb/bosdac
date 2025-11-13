// Packages:
import React, { useState, useCallback, useContext, useRef, useEffect, useMemo } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import prettyMilliseconds from 'pretty-ms'

// Typescript:
import type { MOSDACLog, MOSDACLogData } from '@/pages/api/log'
import { LogDownloadStatus } from '@/components/SidePanel'
import type { MOSDACImageMode } from '@/pages/api/history'

// Assets:
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleIcon,
  Grid2x2CheckIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  SquareIcon,
  TimerIcon,
  TriangleAlertIcon,
  TriangleIcon,
  VideoIcon,
} from 'lucide-react'

// Constants:
import { ANIMATION_SPEEDS } from '@/context/AnimationContext'
import { BOX_COUNT } from '@/lib/box'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const SECOND = 1000, MINUTE = 60 * SECOND

// Components:
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import * as SliderPrimitive from '@radix-ui/react-slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import GlobalAnimationContext from '@/context/GlobalAnimationContext'
import MapContext from '@/context/MapContext'
import AnimationContext from '@/context/AnimationContext'

// Functions:
const AnimationContent = ({
  mode,
  reversedLogs,
  selectedReversedLogIndex,
  onLogSelect,
  logDownloadStatus,
  animationRangeIndices,
  setIsAnimationOn,
  setAnimationRangeIndices,
  formatGMTToLocal12Hours,
  repeat,
  showTimelapseRecordingControls,
  setShowTimelapseRecordingControls,
  isAnimationOn,
  startLongPress,
  stopLongPress,
  isLongPressing,
  pause,
  play,
  stop,
  setRepeat,
  repeatRef,
  selectedAnimationSpeed,
  setSelectedAnimationSpeed,
  averageLogDownloadSpeed,
  numberOfFrames,
  isLoadingManyFrames,
}: {
  mode: MOSDACImageMode
  reversedLogs: MOSDACLogData
  selectedReversedLogIndex: number
  onLogSelect: (log: MOSDACLog, logIndex: number) => Promise<void>
  logDownloadStatus: Map<string, LogDownloadStatus>
  animationRangeIndices: [number, number]
  setIsAnimationOn: React.Dispatch<React.SetStateAction<boolean>>
  setAnimationRangeIndices: React.Dispatch<React.SetStateAction<[number, number]>>
  formatGMTToLocal12Hours: (time: string) => string
  repeat: boolean
  setRepeat: React.Dispatch<React.SetStateAction<boolean>>
  showTimelapseRecordingControls: boolean
  setShowTimelapseRecordingControls: React.Dispatch<React.SetStateAction<boolean>>
  repeatRef: React.RefObject<boolean>
  isAnimationOn: boolean
  startLongPress: (direction: 'forward' | 'backward', _selectedLogIndex: number) => Promise<void>
  stopLongPress: () => void
  isLongPressing: 'forward' | 'backward' | null
  pause: () => void
  play: () => Promise<void>
  stop: () => void
  selectedAnimationSpeed: typeof ANIMATION_SPEEDS[number]
  setSelectedAnimationSpeed: React.Dispatch<React.SetStateAction<typeof ANIMATION_SPEEDS[number]>>
  averageLogDownloadSpeed: number
  numberOfFrames: number
  isLoadingManyFrames: boolean
}) => (
  <div className='relative z-[1] flex flex-col gap-2.5 w-full px-2 py-3 bg-card border rounded-md'>
    {
      reversedLogs.length > 0 && (
        <>
          <div className='relative w-full h-4 pt-1.5 mt-3'>
            <SliderPrimitive.Root
              data-slot='slider'
              value={[selectedReversedLogIndex]}
              min={0}
              max={reversedLogs.length - 1}
              step={1}
              className={cn(
                'absolute -top-2 left-1 flex w-[calc(100%-8px)] px-2 touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
              )}
              onValueChange={([value]) => onLogSelect(reversedLogs[value], reversedLogs.length - 1 - value)}
            >
              <SliderPrimitive.Thumb
                data-slot='slider-thumb'
                className='ring-0 outline-0'
                asChild
              >
                <TriangleIcon className='size-2 text-black fill-black rotate-180' />
              </SliderPrimitive.Thumb>
            </SliderPrimitive.Root>
            <div className='absolute -top-1 flex justify-between items-center w-full h-full px-[7px]'>
              {
                Array.from(Array(reversedLogs.length)).map((_, index) => {
                  const _logDownloadStatus = logDownloadStatus.get(reversedLogs[index].name + '_' + mode)

                  return (
                    <div
                      key={index}
                      className={cn(
                        'w-[1px] h-3 bg-zinc-700 rounded transition-all',
                        _logDownloadStatus === undefined ? 'bg-zinc-700' :
                          _logDownloadStatus === LogDownloadStatus.DOWNLOADING ? 'bg-yellow-500 animate-pulse' :
                            _logDownloadStatus === LogDownloadStatus.DOWNLOADED ? 'bg-green-500' :
                              _logDownloadStatus === LogDownloadStatus.FAILED_TO_DOWNLOAD ? 'bg-rose-500' : 'bg-purple-500'
                      )}
                    />
                  )
                })
              }
            </div>
            <Slider
              value={[animationRangeIndices[0], animationRangeIndices[1]]}
              min={0}
              max={reversedLogs.length - 1}
              step={1}
              onValueChange={([start, end]) => {
                setIsAnimationOn(false)
                setAnimationRangeIndices([start, end])
                let newIndex = selectedReversedLogIndex
                if (selectedReversedLogIndex < start) {
                  newIndex = start
                } else if (selectedReversedLogIndex > end) {
                  newIndex = end
                }
                onLogSelect(reversedLogs[newIndex], reversedLogs.length - 1 - newIndex)
              }}
            />
          </div>
          <div className='flex justify-between items-center w-full'>
            <span className='text-xs'>
              {formatGMTToLocal12Hours(reversedLogs[animationRangeIndices[0]].when.time)} {reversedLogs[animationRangeIndices[0]].when.date}-{reversedLogs[animationRangeIndices[0]].when.month}-{reversedLogs[animationRangeIndices[0]].when.year}
            </span>
            <span className='text-xs'>
              {formatGMTToLocal12Hours(reversedLogs[animationRangeIndices[1]].when.time)} {reversedLogs[animationRangeIndices[1]].when.date}-{reversedLogs[animationRangeIndices[1]].when.month}-{reversedLogs[animationRangeIndices[1]].when.year}
            </span>
          </div>
        </>
      )
    }
    <div className='flex items-center justify-between w-full'>
      <div className='flex items-center justify-center gap-2'>
        <Button
          size='icon'
          variant='outline'
          className='cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
          disabled={(isAnimationOn || ((selectedReversedLogIndex - 1) < animationRangeIndices[0])) && !repeat}
          onMouseDown={() => startLongPress('backward', selectedReversedLogIndex)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
        >
          <ChevronsLeftIcon
            className={cn('transition-all', isLongPressing === 'backward' && 'text-green-600')}
          />
        </Button>
        <Button
          size='icon'
          variant='outline'
          className='cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
          onClick={isAnimationOn ? pause : play}
        >
          {
            isAnimationOn ? (
              <PauseIcon className='text-zinc-800 fill-black' />
            ) : (
              <PlayIcon className='text-zinc-800 fill-black' />
            )
          }
        </Button>
        <Button
          size='icon'
          variant='outline'
          className='cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
          disabled={!isAnimationOn}
          onClick={stop}
        >
          <SquareIcon className='text-zinc-800 fill-black' />
        </Button>
        <Button
          size='icon'
          variant='outline'
          className='cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
          disabled={(isAnimationOn || ((selectedReversedLogIndex + 1) > animationRangeIndices[1])) && !repeat}
          onMouseDown={() => startLongPress('forward', selectedReversedLogIndex)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
        >
          <ChevronsRightIcon
            className={cn('transition-all', isLongPressing === 'forward' && 'text-green-600')}
          />
        </Button>
        <Button
          size='icon'
          variant='outline'
          className='cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
          onClick={() => {
            setRepeat(_repeat => !_repeat)
            repeatRef.current = !repeatRef.current
          }}
        >
          <RepeatIcon
            className={cn('transition-all', repeat && 'text-green-600')}
          />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className='gap-2 cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
          >
            <div className='flex items-center justify-center gap-1.5'>
              <TimerIcon />
              <span>{selectedAnimationSpeed.label}</span>
            </div>
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={cn('z-[1001]', `${geistSans.className} font-sans`)}>
          {
            ANIMATION_SPEEDS.map(animationSpeed => (
              <DropdownMenuItem
                key={animationSpeed.id}
                className='justify-between cursor-pointer'
                onClick={() => setSelectedAnimationSpeed(animationSpeed)}
              >
                <span className='font-medium'>{animationSpeed.label}</span>
                <CheckIcon
                  className={cn(
                    'size-4',
                    animationSpeed.id === selectedAnimationSpeed?.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </DropdownMenuItem>
            ))
          }                  
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div className='flex items-start justify-start gap-2 w-full'>
      <Button
        variant='outline'
        className='cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
        onClick={() => {
          setShowTimelapseRecordingControls(_showTimelapseRecordingControls => !_showTimelapseRecordingControls)
        }}
      >
        <VideoIcon
          className={cn(
            'size-3.5 text-zinc-800 fill-black transition-all',
            showTimelapseRecordingControls && 'text-rose-700 fill-rose-600',
          )}
        />
        Record Timelapse
      </Button>
    </div>

    {
      isLoadingManyFrames && (
        <div className='flex items-start justify-start gap-2 w-full p-2 bg-orange-200 border-[1px] border-orange-300 rounded-sm'>
          <TriangleAlertIcon className='size-4' />
          <span className='text-xs'>You&apos;re about to load in {numberOfFrames} frames.{' '}
            {
              averageLogDownloadSpeed === 0 ? (
                <span className='font-medium'>This may take a long time.</span>
              ) : (
                <>
                  This will take around ~
                  <span className='font-medium'>{prettyMilliseconds(numberOfFrames * averageLogDownloadSpeed, { compact: true })}.</span>
                </>
              )
            }
          </span>
        </div>
      )
    }
  </div>
)

const TimelapseRecordingControls = ({
  showTimelapseRecordingControls,
  startSelectingTilesToRecord,
  isRecording,
  startRecording,
  numberOfSelectedTiles,
  numberOfFrames,
  averageLogDownloadSpeed,
  isLoadingManyFrames,
  useSmallView,
}: {
  showTimelapseRecordingControls: boolean
  startSelectingTilesToRecord: () => void
  isRecording: boolean
  startRecording: () => Promise<void>
  numberOfSelectedTiles: number
  numberOfFrames: number
  averageLogDownloadSpeed: number
  isLoadingManyFrames: boolean
  useSmallView: boolean
}) => {
  // Constants:
  const DEFAULT_WRAPPER_HEIGHT = 50

  // Ref:
  const wrapperRef = useRef<HTMLDivElement>(null)

  // State:
  const [height, setHeight] = useState(DEFAULT_WRAPPER_HEIGHT)

  // Effects:
  useEffect(() => {
    setHeight(wrapperRef.current?.getBoundingClientRect().height ?? DEFAULT_WRAPPER_HEIGHT)
  }, [])
  
  // Return:
  return (
    <div
      ref={wrapperRef}
      className='absolute z-0 flex flex-col space-y-1 w-full px-2 py-3 bg-card border rounded-md transition-all'
      style={{
        top: showTimelapseRecordingControls ? 172 + 4 + (isLoadingManyFrames ? 34 + 10 : 0) + (useSmallView ? isLoadingManyFrames ? 16 : 0 : 0) : 172 - height,
        opacity: showTimelapseRecordingControls ? 1 : 0,
        pointerEvents: showTimelapseRecordingControls ? 'all' : 'none',
      }}
    >
      <span className={cn('mb-0 font-semibold', useSmallView ? 'text-base' : 'text-lg')}>Record A Timelapse</span>
      <span className={cn('mb-2 text-zinc-700', useSmallView ? 'text-xs' : 'text-sm')}>Follow the steps below to record and download a weather timelapse:</span>
      <span className={cn('ml-1', useSmallView ? 'text-xs' : 'text-sm')}>1. Select the tiles on the map that you wish to record.</span>
      <span className={cn('ml-1 mb-2', useSmallView ? 'text-xs' : 'text-sm')}>
        2. Start recording - this process will take {(numberOfSelectedTiles > 0 && averageLogDownloadSpeed > 0) ?
          '~' + prettyMilliseconds(numberOfFrames * numberOfSelectedTiles * (averageLogDownloadSpeed / BOX_COUNT), { compact: true })
          : 'a few seconds'}.
      </span>
      <div className='flex items-center gap-1.5'>
        {
          useSmallView && (
            <Button
              size='sm'
              variant='outline'
              className='w-fit text-xs cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300'
              onClick={startSelectingTilesToRecord}
            >
              <Grid2x2CheckIcon className='size-2 text-zinc-800' />
              Select Tiles
            </Button>
          )
        }
        <Button
          size={useSmallView ? 'sm' : 'default'}
          variant='outline'
          className={cn('w-fit cursor-pointer hover:bg-zinc-200 active:!bg-zinc-300', useSmallView && 'text-xs')}
          disabled={numberOfSelectedTiles === 0}
          onClick={startRecording}
        >
          <CircleIcon
            className={cn(
              'text-zinc-800 fill-black transition-all',
              useSmallView ? 'size-2' : 'size-3.5',
              isRecording && 'text-rose-700 fill-rose-600',
            )}
          />

          Start Recording
        </Button>
      </div>
    </div>
  )
}

const AnimationCombobox = ({
  selectedReversedLogIndex,
}: {
  selectedReversedLogIndex: number
}) => {
  // Constants:
  const {
    useSmallView,
    toggleSmallViewDialog,
    setIsSidePanelPopoverOpen
  } = useContext(UtilitiesContext)
  const {
    animationRangeIndices,
    setAnimationRangeIndices,
  } = useContext(GlobalAnimationContext)
  const {
    reversedLogs,
    onLogSelect,
    logDownloadStatus,
    averageLogDownloadSpeed,
    mode,
  } = useContext(MapContext)
  const {
    isAnimationOn,
    isLongPressing,
    setIsAnimationOn,
    repeat,
    setRepeat,
    selectedTiles,
    showTimelapseRecordingControls,
    setShowTimelapseRecordingControls,
    setIsSelectingTilesToRecord,
    animationPopoverOpen,
    setAnimationPopoverOpen,
    isRecording,
    startRecording,
    repeatRef,
    startLongPress,
    stopLongPress,
    pause,
    play,
    stop,
    selectedAnimationSpeed,
    setSelectedAnimationSpeed,
    numberOfFrames,
  } = useContext(AnimationContext)

  // Memo:
  const isLoadingManyFrames = useMemo(() => (
    !isRecording &&
    (averageLogDownloadSpeed === 0 ? numberOfFrames > 10 : (numberOfFrames * averageLogDownloadSpeed > 2 * MINUTE))
  ), [isRecording, averageLogDownloadSpeed, numberOfFrames])

  // Functions:
  const formatGMTToLocal12Hours = useCallback((time: string) => {
    if (!time || (time.length !== 3 && time.length !== 4)) return time

    const normalized = time.padStart(4, '0')
    const hoursUTC = parseInt(normalized.slice(0, 2), 10)
    const minutesUTC = parseInt(normalized.slice(2), 10)
    if (Number.isNaN(hoursUTC) || Number.isNaN(minutesUTC)) return time

    const offsetMinutes = new Date().getTimezoneOffset()
    const totalMinutesUTC = hoursUTC * 60 + minutesUTC
    let totalMinutesLocal = totalMinutesUTC - offsetMinutes

    totalMinutesLocal = ((totalMinutesLocal % 1440) + 1440) % 1440
    const localHours24 = Math.floor(totalMinutesLocal / 60)
    const localMinutes = totalMinutesLocal % 60

    const ampm = localHours24 < 12 ? 'AM' : 'PM'
    const hours12 = ((localHours24 + 11) % 12) + 1
    const minutesStr = String(localMinutes).padStart(2, '0')
    return `${hours12}:${minutesStr} ${ampm}`
  }, [])

  // Return:
  return (
    <>
      {
        useSmallView ? (
          <Dialog
            open={animationPopoverOpen}
            onOpenChange={async _open => {
              if (_open) {
                await toggleSmallViewDialog(_open)
                setAnimationPopoverOpen(_open)
              } else {
                setAnimationPopoverOpen(_open)
                await toggleSmallViewDialog(_open)
                setShowTimelapseRecordingControls(_open)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant='outline' disabled={reversedLogs.length === 0} className={cn('relative w-full cursor-pointer', animationPopoverOpen && '!bg-zinc-200')}>
                <div className={cn('absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all', isAnimationOn ? 'bg-green-500' : isLongPressing ? 'bg-blue-500' : 'bg-rose-400')} />
                Timelapse
              </Button>
            </DialogTrigger>
            <DialogContent hideOverlay showCloseButton={false} className={cn('z-[1001] !p-0 !bg-transparent !border-none', `${geistSans.className} font-sans`)}>
              <VisuallyHidden>
                <DialogTitle>Layers</DialogTitle>
                <DialogDescription>Select a layer from the list below</DialogDescription>
              </VisuallyHidden>
              <AnimationContent
                mode={mode}
                reversedLogs={reversedLogs}
                selectedReversedLogIndex={selectedReversedLogIndex}
                onLogSelect={onLogSelect}
                logDownloadStatus={logDownloadStatus}
                animationRangeIndices={animationRangeIndices}
                setIsAnimationOn={setIsAnimationOn}
                setAnimationRangeIndices={setAnimationRangeIndices}
                formatGMTToLocal12Hours={formatGMTToLocal12Hours}
                repeat={repeat}
                setRepeat={setRepeat}
                showTimelapseRecordingControls={showTimelapseRecordingControls}
                setShowTimelapseRecordingControls={setShowTimelapseRecordingControls}
                repeatRef={repeatRef}
                isAnimationOn={isAnimationOn}
                startLongPress={startLongPress}
                stopLongPress={stopLongPress}
                isLongPressing={isLongPressing}
                pause={pause}
                play={play}
                stop={stop}
                selectedAnimationSpeed={selectedAnimationSpeed}
                setSelectedAnimationSpeed={setSelectedAnimationSpeed}
                averageLogDownloadSpeed={averageLogDownloadSpeed}
                numberOfFrames={numberOfFrames}
                isLoadingManyFrames={isLoadingManyFrames}
              />
              <TimelapseRecordingControls
                showTimelapseRecordingControls={showTimelapseRecordingControls}
                isRecording={isRecording}
                startRecording={startRecording}
                numberOfSelectedTiles={selectedTiles.size}
                averageLogDownloadSpeed={averageLogDownloadSpeed}
                numberOfFrames={numberOfFrames}
                isLoadingManyFrames={isLoadingManyFrames}
                useSmallView={useSmallView}
                startSelectingTilesToRecord={async () => {
                  setIsSelectingTilesToRecord(true)
                  setAnimationPopoverOpen(false)
                  await toggleSmallViewDialog(false)
                  setIsSidePanelPopoverOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <>
            <Popover
              open={animationPopoverOpen}
              onOpenChange={open => {
                if (!showTimelapseRecordingControls) setAnimationPopoverOpen(open)
              }}
            >
              <PopoverTrigger 
                asChild
                onClick={() => {
                  if (animationPopoverOpen && showTimelapseRecordingControls) {
                    setShowTimelapseRecordingControls(false)
                    setAnimationPopoverOpen(false)
                  }
                }}
              >
                <Button variant='outline' disabled={reversedLogs.length === 0} className={cn('relative w-full cursor-pointer', animationPopoverOpen && '!bg-zinc-200')}>
                  <div className={cn('absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all', isAnimationOn ? 'bg-green-500' : isLongPressing ? 'bg-blue-500' : 'bg-rose-400')} />
                  Timelapse
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className={cn('z-[1001] w-[600px] !p-0 !bg-transparent !border-none', `${geistSans.className} font-sans`)}
                align='start'
                side='left'
                sideOffset={16}
              >
                <AnimationContent
                  mode={mode}
                  reversedLogs={reversedLogs}
                  selectedReversedLogIndex={selectedReversedLogIndex}
                  onLogSelect={onLogSelect}
                  logDownloadStatus={logDownloadStatus}
                  animationRangeIndices={animationRangeIndices}
                  setIsAnimationOn={setIsAnimationOn}
                  setAnimationRangeIndices={setAnimationRangeIndices}
                  formatGMTToLocal12Hours={formatGMTToLocal12Hours}
                  repeat={repeat}
                  setRepeat={setRepeat}
                  showTimelapseRecordingControls={showTimelapseRecordingControls}
                  setShowTimelapseRecordingControls={setShowTimelapseRecordingControls}
                  repeatRef={repeatRef}
                  isAnimationOn={isAnimationOn}
                  startLongPress={startLongPress}
                  stopLongPress={stopLongPress}
                  isLongPressing={isLongPressing}
                  pause={pause}
                  play={play}
                  stop={stop}
                  selectedAnimationSpeed={selectedAnimationSpeed}
                  setSelectedAnimationSpeed={setSelectedAnimationSpeed}
                  averageLogDownloadSpeed={averageLogDownloadSpeed}
                  numberOfFrames={numberOfFrames}
                  isLoadingManyFrames={isLoadingManyFrames}
                />
                <TimelapseRecordingControls
                  showTimelapseRecordingControls={showTimelapseRecordingControls}
                  isRecording={isRecording}
                  startRecording={startRecording}
                  numberOfSelectedTiles={selectedTiles.size}
                  averageLogDownloadSpeed={averageLogDownloadSpeed}
                  numberOfFrames={numberOfFrames}
                  isLoadingManyFrames={isLoadingManyFrames}
                  useSmallView={useSmallView}
                  startSelectingTilesToRecord={async () => {
                    setIsSelectingTilesToRecord(true)
                    setAnimationPopoverOpen(false)
                    await toggleSmallViewDialog(false)
                    setIsSidePanelPopoverOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </>
        )
      }
    </>
  )
}

// Exports:
export default AnimationCombobox
