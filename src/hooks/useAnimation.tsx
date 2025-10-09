// Packages:
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import sleep from 'sleep-promise'

// Constants:
import { ANIMATION_SPEEDS, LogDownloadStatus } from '@/components/SidePanel'
const LONG_PRESS_DELAY = 500

// Context:
import AnimationContext from '@/context/AnimationContext'
import MapContext from '@/context/MapContext'

// Functions:
const useAnimation = () => {
  // Constants:
  const {
    animationRangeIndices,
  } = useContext(AnimationContext)
  const {
    setIsHistoryOn,
    reversedLogs,
    selectedLogIndex,
    onLogSelect,
    logDownloadStatus,
  } = useContext(MapContext)

  // State:
  const [isAnimationOn, setIsAnimationOn] = useState(false)
  const [selectedAnimationSpeed, setSelectedAnimationSpeed] = useState<typeof ANIMATION_SPEEDS[number]>(ANIMATION_SPEEDS[0])
  const [isLongPressing, setIsLongPressing] = useState<'forward' | 'backward' | null>(null)
  const [repeat, setRepeat] = useState(false)

  // Ref:
  const isLongPressingRef = useRef<'forward' | 'backward' | null>(null)
  const repeatRef = useRef(false)
  const animationRangeIndicesRef = useRef(animationRangeIndices)
  const isAnimationOnRef = useRef(isAnimationOn)

  // Memo:
  const numberOfFrames = useMemo(() => {
    let totalUnloadedFrames = (animationRangeIndices[1] - animationRangeIndices[0]) + 1

    for (let i = animationRangeIndices[0]; i <= animationRangeIndices[1]; i++) {
      const relevantLog = reversedLogs[i]
      if (relevantLog && logDownloadStatus.get(relevantLog.name) === LogDownloadStatus.DOWNLOADED) {
        if (totalUnloadedFrames > 0) totalUnloadedFrames--
      }
    }

    return totalUnloadedFrames
  }, [reversedLogs, animationRangeIndices, logDownloadStatus])

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

  return {
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
    repeatRef,
    play,
    pause,
    stop,
  }
}

// Exports:
export default useAnimation
