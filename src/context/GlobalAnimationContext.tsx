// Packages:
import { createContext, useMemo, useState } from 'react'

// Typescript:
interface IGlobalAnimationContext {
  animationRangeIndices: [number, number]
  setAnimationRangeIndices: React.Dispatch<React.SetStateAction<[number, number]>>
}

// Constants:
const GlobalAnimationContext = createContext<IGlobalAnimationContext>({
  animationRangeIndices: [0, 0],
  setAnimationRangeIndices: () => {}
})

// Functions:
export const GlobalAnimationContextProvider = ({ children }: { children: React.ReactNode }) => {  
  // State:
  const [animationRangeIndices, setAnimationRangeIndices] = useState<[number, number]>([0, 0])
  
  // Return:
  return (
    <GlobalAnimationContext.Provider
      value={useMemo(() => ({
        animationRangeIndices,
        setAnimationRangeIndices,
      }), [
        animationRangeIndices,
      ])}
    >
      {children}
    </GlobalAnimationContext.Provider>
  )
}

// Exports:
export default GlobalAnimationContext
