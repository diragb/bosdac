// Packages:
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

// Typescript:
interface IAnimationContext {
  animationRangeIndices: [number, number]
  setAnimationRangeIndices: React.Dispatch<React.SetStateAction<[number, number]>>
}

// Constants:
const AnimationContext = createContext<IAnimationContext>({
  animationRangeIndices: [0, 0],
  setAnimationRangeIndices: () => {}
})

// Functions:
export const AnimationContextProvider = ({ children }: { children: React.ReactNode }) => {
  // State:
  const [animationRangeIndices, setAnimationRangeIndices] = useState<[number, number]>([0, 0])
  
  // Return:
  return (
    <AnimationContext.Provider
      value={useMemo(() => ({
        animationRangeIndices,
        setAnimationRangeIndices,
      }), [
        animationRangeIndices,
      ])}
    >
      {children}
    </AnimationContext.Provider>
  )
}

// Exports:
export default AnimationContext
