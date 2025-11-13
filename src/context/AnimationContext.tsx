// Packages:
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import sleep from 'sleep-promise'
import getTileURLsForBox from '@/lib/getTileURLsForBox'
import { getAnimation } from '@/lib/animation'

// Typescript:
interface IAnimationContext {
  isAnimationOn: boolean
  setIsAnimationOn: React.Dispatch<React.SetStateAction<boolean>>
  selectedAnimationSpeed: typeof ANIMATION_SPEEDS[number]
  setSelectedAnimationSpeed: React.Dispatch<React.SetStateAction<typeof ANIMATION_SPEEDS[number]>>
  numberOfFrames: number
  startLongPress: (direction: 'forward' | 'backward', _selectedReversedLogIndex: number) => Promise<void>
  stopLongPress: () => void
  isLongPressing: 'forward' | 'backward' | null
  repeat: boolean
  setRepeat: React.Dispatch<React.SetStateAction<boolean>>
  showTimelapseRecordingControls: boolean
  setShowTimelapseRecordingControls: React.Dispatch<React.SetStateAction<boolean>>
  selectedTiles: Set<string>
  setSelectedTiles: React.Dispatch<React.SetStateAction<Set<string>>>
  isRecording: boolean
  startRecording: () => Promise<void>
  repeatRef: React.RefObject<boolean>
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  recordingStatus: string
}

// Constants:
import { LogDownloadStatus } from '@/components/SidePanel'

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
const LONG_PRESS_DELAY = 500
const AnimationContext = createContext<IAnimationContext>({
  isAnimationOn: false,
  setIsAnimationOn: () => {},
  selectedAnimationSpeed: ANIMATION_SPEEDS[0],
  setSelectedAnimationSpeed: () => {},
  numberOfFrames: 0,
  startLongPress: async () => {},
  stopLongPress: () => {},
  isLongPressing: null,
  repeat: false,
  setRepeat: () => {},
  showTimelapseRecordingControls: false,
  setShowTimelapseRecordingControls: () => {},
  selectedTiles: new Set(),
  setSelectedTiles: () => {},
  isRecording: false,
  startRecording: async () => {},
  repeatRef: { current: false },
  play: async () => {},
  pause: () => {},
  stop: () => {},
  recordingStatus: 'Fetching tiles',
})

import { BOXES } from '@/lib/box'

// Context:
import GlobalAnimationContext from './GlobalAnimationContext'
import MapContext from '@/context/MapContext'

// Functions:
export const AnimationContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const { animationRangeIndices } = useContext(GlobalAnimationContext)
  const {
    setIsHistoryOn,
    reversedLogs,
    selectedLogIndex,
    onLogSelect,
    logDownloadStatus,
    selectedLog,
    opacity,
    mode,
  } = useContext(MapContext)

  // State:
  const [isAnimationOn, setIsAnimationOn] = useState(false)
  const [selectedAnimationSpeed, setSelectedAnimationSpeed] = useState<typeof ANIMATION_SPEEDS[number]>(ANIMATION_SPEEDS[0])
  const [isLongPressing, setIsLongPressing] = useState<'forward' | 'backward' | null>(null)
  const [repeat, setRepeat] = useState(true)
  const [showTimelapseRecordingControls, setShowTimelapseRecordingControls] = useState(false)
  const [selectedTiles, setSelectedTiles] = useState<Set<string>>(new Set())
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState('Fetching tiles')

  // Ref:
  const isLongPressingRef = useRef<'forward' | 'backward' | null>(null)
  const repeatRef = useRef(true)
  const animationRangeIndicesRef = useRef(animationRangeIndices)
  const isAnimationOnRef = useRef(isAnimationOn)

  // Memo:
  const numberOfFrames = useMemo(() => {
    let totalUnloadedFrames = (animationRangeIndices[1] - animationRangeIndices[0]) + 1

    for (let i = animationRangeIndices[0]; i <= animationRangeIndices[1]; i++) {
      const relevantLog = reversedLogs[i]
      if (relevantLog && logDownloadStatus.get(relevantLog.name + '_' + mode) === LogDownloadStatus.DOWNLOADED) {
        if (totalUnloadedFrames > 0) totalUnloadedFrames--
      }
    }

    return totalUnloadedFrames
  }, [reversedLogs, animationRangeIndices, logDownloadStatus, mode])

  const tileURLsForSelectedTiles = useMemo(() => {
    const tileURLs = new Map<string, [string, string, string, string]>()
    const indicesGroups: [string, number, number][] = []
    selectedTiles.forEach(selectedTile => {
      const indexGroup = selectedTile.split('-')
      const index = parseInt(indexGroup[0]), jindex = parseInt(indexGroup[1])
      indicesGroups.push([selectedTile, index, jindex])
    })

    for (const indexGroup of indicesGroups) {
      const box = BOXES[indexGroup[1]][indexGroup[2]]
      tileURLs.set(indexGroup[0], getTileURLsForBox({ z: 5, box }))
    }

    return tileURLs
  }, [selectedTiles])

  // Functions:
  const moveOneFrameBackward = (_selectedReversedLogIndex: number, allowRepeat?: boolean) => {
    if (isAnimationOn) return
    const newIndex = _selectedReversedLogIndex - 1
    if (newIndex >= animationRangeIndices[0] && newIndex <= animationRangeIndices[1]) {
      onLogSelect(reversedLogs[newIndex], reversedLogs.length - 1 - newIndex)
    } else if (newIndex < animationRangeIndices[0] && allowRepeat) {
      onLogSelect(reversedLogs[animationRangeIndices[1]], reversedLogs.length - 1 - animationRangeIndices[1])
    }
  }

  const moveOneFrameForward = (_selectedReversedLogIndex: number, allowRepeat?: boolean) => {
    if (isAnimationOn) return
    const newIndex = _selectedReversedLogIndex + 1
    if (newIndex >= animationRangeIndices[0] && newIndex <= animationRangeIndices[1]) {
      onLogSelect(reversedLogs[newIndex], reversedLogs.length - 1 - newIndex)
    } else if (newIndex > animationRangeIndices[1] && allowRepeat) {
      onLogSelect(reversedLogs[animationRangeIndices[0]], reversedLogs.length - 1 - animationRangeIndices[0])
    }
  }

  const startLongPress = async (direction: 'forward' | 'backward', _selectedReversedLogIndex: number) => {
    if (isAnimationOn) return
    
    isLongPressingRef.current = direction
    if (direction === 'forward') {
      moveOneFrameForward(_selectedReversedLogIndex, repeatRef.current)
    } else {
      moveOneFrameBackward(_selectedReversedLogIndex, repeatRef.current)
    }

    await sleep(LONG_PRESS_DELAY)
    
    if (isLongPressingRef.current === null || isLongPressingRef.current !== direction) {
      const nextSelectedReversedLogIndex = direction === 'forward' ?
        (_selectedReversedLogIndex + 1 <= animationRangeIndices[1] ? _selectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]) :
        (_selectedReversedLogIndex - 1 >= animationRangeIndices[0] ? _selectedReversedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0])
      
      setIsHistoryOn(nextSelectedReversedLogIndex !== animationRangeIndices[1])
      return
    }

    setIsLongPressing(direction)
    let nextSelectedReversedLogIndex = direction === 'forward' ?
      (_selectedReversedLogIndex + 1 <= animationRangeIndices[1] ? _selectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]) :
      (_selectedReversedLogIndex - 1 >= animationRangeIndices[0] ? _selectedReversedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0])

    while (true) {
      await sleep(selectedAnimationSpeed.value)
      if (isLongPressingRef.current === null || isLongPressingRef.current !== direction) break

      if (direction === 'forward') {
        moveOneFrameForward(nextSelectedReversedLogIndex)
        nextSelectedReversedLogIndex = nextSelectedReversedLogIndex + 1 <= animationRangeIndices[1] ? nextSelectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
      } else {
        moveOneFrameBackward(nextSelectedReversedLogIndex)
        nextSelectedReversedLogIndex = nextSelectedReversedLogIndex - 1 >= animationRangeIndices[0] ? nextSelectedReversedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0]
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

    const selectedReversedLogIndex = reversedLogs.length - 1 - selectedLogIndex
    let nextSelectedReversedLogIndex = selectedReversedLogIndex + 1 <= animationRangeIndices[1] ? selectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
    
    while (isAnimationOnRef.current) {
      await sleep(selectedAnimationSpeed.value)
      if (!isAnimationOnRef.current) break
      
      const previousSelectedLogIndex = nextSelectedReversedLogIndex
      onLogSelect(reversedLogs[nextSelectedReversedLogIndex], reversedLogs.length - 1 - nextSelectedReversedLogIndex)
      nextSelectedReversedLogIndex = nextSelectedReversedLogIndex = nextSelectedReversedLogIndex + 1 <= animationRangeIndices[1] ? nextSelectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
      
      if (previousSelectedLogIndex === animationRangeIndices[1] && nextSelectedReversedLogIndex === animationRangeIndices[1]) {
        setIsAnimationOn(false)
        isAnimationOnRef.current = false
        break
      }
    }
  }

  const pause = () => {
    setIsAnimationOn(false)
    const selectedReversedLogIndex = reversedLogs.length - 1 - selectedLogIndex
    setIsHistoryOn(selectedReversedLogIndex !== animationRangeIndices[1])
  }

  const stop = () => {
    setIsAnimationOn(false)
    onLogSelect(reversedLogs[animationRangeIndices[1]], reversedLogs.length - 1 - animationRangeIndices[1])
  }

  const startRecording = async () => {
    if (selectedLog) {
      setIsRecording(true)
      const generatedAnimation = await getAnimation({
        reversedLogs,
        animationRangeIndices,
        mode,
        opacity,
        selectedTiles,
        tileURLsForSelectedTiles,
        selectedAnimationSpeed,
        setAnimationStatus: setRecordingStatus,
      })
      setIsRecording(false)

      const url = URL.createObjectURL(generatedAnimation)
      const a = document.createElement('a')
      a.href = url
      a.download =`BOSDAC-${animationRangeIndices[1] - animationRangeIndices[0] + 1}F-${selectedTiles.size}T-${selectedAnimationSpeed.id}.webm`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }

  // Effects:
  useEffect(() => {
    animationRangeIndicesRef.current = animationRangeIndices
  }, [animationRangeIndices])

  useEffect(() => {
    isAnimationOnRef.current = isAnimationOn
  }, [isAnimationOn])

  useEffect(() => {
    return () => {
      stopLongPress()
    }
  }, [stopLongPress])
  
  // Return:
  return (
    <AnimationContext.Provider
      value={useMemo(() => ({
        isAnimationOn,
        setIsAnimationOn,
        selectedAnimationSpeed,
        setSelectedAnimationSpeed,
        numberOfFrames,
        startLongPress,
        stopLongPress,
        isLongPressing,
        repeat,
        setRepeat,
        showTimelapseRecordingControls,
        setShowTimelapseRecordingControls,
        selectedTiles,
        setSelectedTiles,
        isRecording,
        startRecording,
        repeatRef,
        play,
        pause,
        stop,
        recordingStatus,
      }), [
        isAnimationOn,
        selectedAnimationSpeed,
        numberOfFrames,
        isLongPressing,
        repeat,
        showTimelapseRecordingControls,
        selectedTiles,
        isRecording,
        recordingStatus,
      ])}
    >
      {children}
    </AnimationContext.Provider>
  )
}

// Exports:
export default AnimationContext
