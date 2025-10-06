// Packages:
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import prettyMilliseconds from 'pretty-ms'
import sleep from 'sleep-promise'

// Typescript:
import type { MOSDACLog, MOSDACLogData } from '@/pages/api/log'
import { LogDownloadStatus } from '@/components/SidePanel'

// Assets:
import { CheckIcon, ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon, PauseIcon, PlayIcon, RepeatIcon, SquareIcon, TimerIcon, TriangleAlertIcon, TriangleIcon } from 'lucide-react'

// Constants:
import { ANIMATION_SPEEDS } from '@/components/SidePanel'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const SECOND = 1000, MINUTE = 60 * SECOND
const LONG_PRESS_DELAY = 500

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

// Functions:
const AnimationCombobox = ({
  logs,
  logDownloadStatus,
  averageLogDownloadSpeed,
  isAnimationOn,
  setIsAnimationOn,
  selectedLogIndex,
  onLogSelect,
  animationRangeIndices,
  setAnimationRangeIndices,
  selectedAnimationSpeed,
  setSelectedAnimationSpeed,
}: {
  logs: MOSDACLogData
  logDownloadStatus: Map<string, LogDownloadStatus>
  averageLogDownloadSpeed: number
  isAnimationOn: boolean
  setIsAnimationOn: React.Dispatch<React.SetStateAction<boolean>>
  selectedLogIndex: number
  onLogSelect: (log: MOSDACLog, logIndex: number) => Promise<void>
  animationRangeIndices: [number, number]
  setAnimationRangeIndices: React.Dispatch<React.SetStateAction<[number, number]>>
  selectedAnimationSpeed: typeof ANIMATION_SPEEDS[number]
  setSelectedAnimationSpeed: React.Dispatch<React.SetStateAction<typeof ANIMATION_SPEEDS[number]>>
}) => {
  // Ref:
  const isLongPressingRef = useRef<'forward' | 'backward' | null>(null)
  const repeatRef = useRef(false)
  const animationRangeIndicesRef = useRef(animationRangeIndices)
  const isAnimationOnRef = useRef(isAnimationOn)

  // State:
  const [animationPopoverOpen, setAnimationPopoverOpen] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState<'forward' | 'backward' | null>(null)
  const [repeat, setRepeat] = useState(false)

  // Memo:
  const numberOfFrames = useMemo(() => {
    let totalUnloadedFrames = (animationRangeIndices[1] - animationRangeIndices[0]) + 1

    for (let i = animationRangeIndices[0]; i <= animationRangeIndices[1]; i++) {
      const relevantLog = logs[i]
      if (relevantLog && logDownloadStatus.get(relevantLog.name) === LogDownloadStatus.DOWNLOADED) {
        if (totalUnloadedFrames > 0) totalUnloadedFrames--
      }
    }

    return totalUnloadedFrames
  }, [logs, animationRangeIndices, logDownloadStatus])

  // Functions:
  const formatGMTToLocal12Hours = (time: string) => {
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
  }

  const moveOneFrameBackward = (_selectedLogIndex: number, allowRepeat?: boolean) => {
    if (isAnimationOn) return
    const newIndex = _selectedLogIndex - 1
    if (newIndex >= animationRangeIndices[0] && newIndex <= animationRangeIndices[1]) {
      onLogSelect(logs[newIndex], logs.length - 1 - newIndex)
    } else if (newIndex < animationRangeIndices[0] && allowRepeat) {
      onLogSelect(logs[animationRangeIndices[1]], logs.length - 1 - animationRangeIndices[1])
    }
  }

  const moveOneFrameForward = (_selectedLogIndex: number, allowRepeat?: boolean) => {
    if (isAnimationOn) return
    const newIndex = _selectedLogIndex + 1
    if (newIndex >= animationRangeIndices[0] && newIndex <= animationRangeIndices[1]) {
      onLogSelect(logs[newIndex], logs.length - 1 - newIndex)
    } else if (newIndex > animationRangeIndices[1] && allowRepeat) {
      onLogSelect(logs[animationRangeIndices[0]], logs.length - 1 - animationRangeIndices[0])
    }
  }

  const startLongPress = async (direction: 'forward' | 'backward', _selectedLogIndex: number) => {
    if (isAnimationOn) return
    
    isLongPressingRef.current = direction
    if (direction === 'forward') {
      moveOneFrameForward(_selectedLogIndex, repeatRef.current)
    } else {
      moveOneFrameBackward(_selectedLogIndex, repeatRef.current)
    }

    await sleep(LONG_PRESS_DELAY)
    
    if (isLongPressingRef.current === null || isLongPressingRef.current !== direction) return

    setIsLongPressing(direction)
    let nextSelectedLogIndex = direction === 'forward' ?
      (_selectedLogIndex + 1 <= animationRangeIndices[1] ? _selectedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]) :
      (_selectedLogIndex - 1 >= animationRangeIndices[0] ? _selectedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0])

    while (true) {
      await sleep(selectedAnimationSpeed.value)
      if (isLongPressingRef.current === null || isLongPressingRef.current !== direction) break

      if (direction === 'forward') {
        moveOneFrameForward(nextSelectedLogIndex)
        nextSelectedLogIndex = nextSelectedLogIndex + 1 <= animationRangeIndices[1] ? nextSelectedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
      } else {
        moveOneFrameBackward(nextSelectedLogIndex)
        nextSelectedLogIndex = nextSelectedLogIndex - 1 >= animationRangeIndices[0] ? nextSelectedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0]
      }
    }
  }

  const stopLongPress = useCallback(() => {
    isLongPressingRef.current = null
    setIsLongPressing(null)
  }, [])

  const play = async () => {
    if (isAnimationOnRef.current) return

    setIsAnimationOn(true)
    isAnimationOnRef.current = true

    let nextSelectedLogIndex = selectedLogIndex + 1 <= animationRangeIndices[1] ? selectedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
    
    while (isAnimationOnRef.current) {
      await sleep(selectedAnimationSpeed.value)
      if (!isAnimationOnRef.current) break
      
      const previousSelectedLogIndex = nextSelectedLogIndex
      onLogSelect(logs[nextSelectedLogIndex], logs.length - 1 - nextSelectedLogIndex)
      nextSelectedLogIndex = nextSelectedLogIndex = nextSelectedLogIndex + 1 <= animationRangeIndices[1] ? nextSelectedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
      
      if (previousSelectedLogIndex === animationRangeIndices[1] && nextSelectedLogIndex === animationRangeIndices[1]) {
        setIsAnimationOn(false)
        isAnimationOnRef.current = false
        break
      }
    }
  }

  const pause = () => {
    setIsAnimationOn(false)
  }

  const stop = () => {
    setIsAnimationOn(false)
    onLogSelect(logs[animationRangeIndices[0]], logs.length - 1 - animationRangeIndices[0])
  }

  // Effects:
  useEffect(() => {
    return () => {
      stopLongPress()
    }
  }, [stopLongPress])

  useEffect(() => {
    animationRangeIndicesRef.current = animationRangeIndices
  }, [animationRangeIndices])

  useEffect(() => {
    isAnimationOnRef.current = isAnimationOn
  }, [isAnimationOn])

  // Return:
  return (
    <Popover open={animationPopoverOpen} onOpenChange={setAnimationPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' disabled={logs.length === 0} className={cn('relative w-full cursor-pointer', animationPopoverOpen && '!bg-zinc-200')}>
          <div className={cn('absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all', isAnimationOn ? 'bg-green-500' : isLongPressing ? 'bg-blue-500' : 'bg-rose-400')} />
          Animation
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('z-[1001] w-[600px] px-2 py-3 bg-card', `${geistSans.className} font-sans`)} align='start' side='left' sideOffset={16}>
        <div className='flex flex-col gap-2.5 w-full'>
          {
            logs.length > 0 && (
              <>
                <div className='relative w-full h-4 pt-1.5 mt-3'>
                  <SliderPrimitive.Root
                    data-slot='slider'
                    value={[selectedLogIndex]}
                    min={0}
                    max={logs.length - 1}
                    step={1}
                    className={cn(
                      'absolute -top-2 left-1 flex w-[calc(100%-8px)] px-2 touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
                    )}
                    onValueChange={([value]) => onLogSelect(logs[value], logs.length - 1 - value)}
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
                      Array.from(Array(logs.length)).map((_, index) => {
                        const _logDownloadStatus = logDownloadStatus.get(logs[index].name)

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
                    max={logs.length - 1}
                    step={1}
                    onValueChange={([start, end]) => {
                      setIsAnimationOn(false)
                      setAnimationRangeIndices([start, end])
                      let newIndex = selectedLogIndex
                      if (selectedLogIndex < start) {
                        newIndex = start
                      } else if (selectedLogIndex > end) {
                        newIndex = end
                      }
                      onLogSelect(logs[newIndex], logs.length - 1 - newIndex)
                    }}
                  />
                </div>
                <div className='flex justify-between items-center w-full'>
                  <span className='text-xs'>
                    {formatGMTToLocal12Hours(logs[animationRangeIndices[0]].when.time)} {logs[animationRangeIndices[0]].when.date}-{logs[animationRangeIndices[0]].when.month}-{logs[animationRangeIndices[0]].when.year}
                  </span>
                  <span className='text-xs'>
                    {formatGMTToLocal12Hours(logs[animationRangeIndices[1]].when.time)} {logs[animationRangeIndices[1]].when.date}-{logs[animationRangeIndices[1]].when.month}-{logs[animationRangeIndices[1]].when.year}
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
                disabled={(isAnimationOn || ((selectedLogIndex - 1) < animationRangeIndices[0])) && !repeat}
                onMouseDown={() => startLongPress('backward', selectedLogIndex)}
                onMouseUp={stopLongPress}
                onMouseLeave={stopLongPress}
                onTouchStart={() => startLongPress('backward', selectedLogIndex)}
                onTouchEnd={stopLongPress}
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
                disabled={(isAnimationOn || ((selectedLogIndex + 1) > animationRangeIndices[1])) && !repeat}
                onMouseDown={() => startLongPress('forward', selectedLogIndex)}
                onMouseUp={stopLongPress}
                onMouseLeave={stopLongPress}
                onTouchStart={() => startLongPress('forward', selectedLogIndex)}
                onTouchEnd={stopLongPress}
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
      </PopoverContent>
    </Popover>
  )
}

// Exports:
export default AnimationCombobox
