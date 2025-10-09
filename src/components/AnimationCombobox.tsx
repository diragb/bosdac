// Packages:
import React, { useMemo, useState, useCallback, useContext } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import prettyMilliseconds from 'pretty-ms'

// Typescript:
import type { MOSDACLog, MOSDACLogData } from '@/pages/api/log'
import { LogDownloadStatus } from '@/components/SidePanel'

// Assets:
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  SquareIcon,
  TimerIcon,
  TriangleAlertIcon,
  TriangleIcon,
} from 'lucide-react'

// Constants:
import { ANIMATION_SPEEDS } from '@/components/SidePanel'

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
import useAnimation from '@/hooks/useAnimation'
import MapContext from '@/context/MapContext'
import AnimationContext from '@/context/AnimationContext'

// Functions:
const AnimationContent = ({
  reversedLogs,
  selectedReversedLogIndex,
  onLogSelect,
  logDownloadStatus,
  animationRangeIndices,
  setIsAnimationOn,
  setAnimationRangeIndices,
  formatGMTToLocal12Hours,
  repeat,
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
}: {
  useSmallView: boolean
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
  repeatRef: React.MutableRefObject<boolean>
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
}) => (
  <div className='flex flex-col gap-2.5 w-full'>
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
                  const _logDownloadStatus = logDownloadStatus.get(reversedLogs[index].name)

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
    {
      (averageLogDownloadSpeed === 0 ? numberOfFrames > 10 : (numberOfFrames * averageLogDownloadSpeed > 2 * MINUTE)) && (
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

const AnimationCombobox = ({
  selectedReversedLogIndex,
}: {
  selectedReversedLogIndex: number
}) => {
  // Constants:
  const {
    useSmallView,
    toggleSmallViewDialog,
  } = useContext(UtilitiesContext)
  const {
    animationRangeIndices,
    setAnimationRangeIndices,
  } = useContext(AnimationContext)
  const {
    reversedLogs,
    onLogSelect,
    logDownloadStatus,
    averageLogDownloadSpeed,
  } = useContext(MapContext)
  const {
    isAnimationOn,
    isLongPressing,
    setIsAnimationOn,
    repeat,
    setRepeat,
    repeatRef,
    startLongPress,
    stopLongPress,
    pause,
    play,
    stop,
    selectedAnimationSpeed,
    setSelectedAnimationSpeed,
    numberOfFrames,
  } = useAnimation()

  // State:
  const [animationPopoverOpen, setAnimationPopoverOpen] = useState(false)

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
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant='outline' disabled={reversedLogs.length === 0} className={cn('relative w-full cursor-pointer', animationPopoverOpen && '!bg-zinc-200')}>
                <div className={cn('absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all', isAnimationOn ? 'bg-green-500' : isLongPressing ? 'bg-blue-500' : 'bg-rose-400')} />
                Animation
              </Button>
            </DialogTrigger>
            <DialogContent hideOverlay showCloseButton={false} className={cn('z-[1001] p-2', `${geistSans.className} font-sans`)}>
              <VisuallyHidden>
                <DialogTitle>Layers</DialogTitle>
                <DialogDescription>Select a layer from the list below</DialogDescription>
              </VisuallyHidden>
              <AnimationContent
                useSmallView={useSmallView}
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
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Popover open={animationPopoverOpen} onOpenChange={setAnimationPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant='outline' disabled={reversedLogs.length === 0} className={cn('relative w-full cursor-pointer', animationPopoverOpen && '!bg-zinc-200')}>
                <div className={cn('absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all', isAnimationOn ? 'bg-green-500' : isLongPressing ? 'bg-blue-500' : 'bg-rose-400')} />
                Animation
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn('z-[1001] w-[600px] px-2 py-3 bg-card', `${geistSans.className} font-sans`)} align='start' side='left' sideOffset={16}>
              <AnimationContent
                useSmallView={useSmallView}
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
              />
            </PopoverContent>
          </Popover>
        )
      }
    </>
  )
}

// Exports:
export default AnimationCombobox
