// Packages:
import React, { useContext, useEffect, useState } from 'react'
import sleep from 'sleep-promise'
import { cn } from '@/lib/utils'

// Components:
import { Spinner } from './ui/spinner'

// Context:
import AnimationContext from '@/context/AnimationContext'

// Functions:
const AnimationOverlay = () => {
  // Constants:
  const { isRecording, recordingStatus } = useContext(AnimationContext)

  // State:
  const [isAnimationOverlayVisible, setIsAnimationOverlayVisible] = useState(false)
  const [isAnimationOverlayRendering, setIsAnimationOverlayRendering] = useState(false)

  // Effects:
  useEffect(() => {
    (async () => {
      if (isRecording) {
        setIsAnimationOverlayRendering(true)
        await sleep(150)
        setIsAnimationOverlayVisible(true)
      } else {
        setIsAnimationOverlayVisible(false)
        await sleep(150)
        setIsAnimationOverlayRendering(false)
      }
    })()
  }, [isRecording])

  // Return:
  return isAnimationOverlayRendering && (
    <div
      className={cn(
        'absolute top-0 left-0 z-[10000] flex justify-center items-center flex-col gap-1 w-screen h-screen bg-zinc-800/75 backdrop-blur-sm cursor-default select-none transition-all',
        isAnimationOverlayVisible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <span className='text-2xl font-medium text-zinc-50'>Generating Timelapse</span>
      <div className='flex items-center justify-center gap-2'>
        <Spinner className='text-zinc-200' />
        <span className='font-light text-zinc-200'>{recordingStatus}</span>
      </div>
    </div>
  )
}

// Exports:
export default AnimationOverlay
