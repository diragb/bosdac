// Packages:
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import sleep from 'sleep-promise'

// Typescript:
interface IUtilitiesContext {
  useSmallView: boolean
  setUseSmallView: React.Dispatch<React.SetStateAction<boolean>>
  isSmallViewDialogVisible: boolean
  setIsShowSmallViewDialogVisible: React.Dispatch<React.SetStateAction<boolean>>
  isSmallViewDialogRendering: boolean
  setIsShowSmallViewDialogRendering: React.Dispatch<React.SetStateAction<boolean>>
  isSidePanelPopoverOpen: boolean
  setIsSidePanelPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>
  isMOSDACDownDialogOpen: boolean
  setIsMOSDACDownDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleSmallViewDialog: (state: boolean) => Promise<void>
}

// Constants:
const UtilitiesContext = createContext<IUtilitiesContext>({
  useSmallView: false,
  setUseSmallView: () => {},
  isSmallViewDialogVisible: false,
  setIsShowSmallViewDialogVisible: () => {},
  isSmallViewDialogRendering: false,
  setIsShowSmallViewDialogRendering: () => {},
  isSidePanelPopoverOpen: false,
  setIsSidePanelPopoverOpen: () => {},
  isMOSDACDownDialogOpen: false,
  setIsMOSDACDownDialogOpen: () => {},
  toggleSmallViewDialog: async () => {},
})

// Functions:
export const UtilitiesContextProvider = ({ children }: { children: React.ReactNode }) => {
  // State:
  const [useSmallView, setUseSmallView] = useState(false)
  const [isSmallViewDialogVisible, setIsShowSmallViewDialogVisible] = useState(false)
  const [isSmallViewDialogRendering, setIsShowSmallViewDialogRendering] = useState(false)
  const [isSidePanelPopoverOpen, setIsSidePanelPopoverOpen] = useState(false)
  const [isMOSDACDownDialogOpen, setIsMOSDACDownDialogOpen] = useState(false)

  // Functions:
  const toggleSmallViewDialog = useCallback(async (state: boolean) => {
    if (state) {
      setIsShowSmallViewDialogRendering(true)
      await sleep(0)
      setIsShowSmallViewDialogVisible(true)
    } else {
      setIsShowSmallViewDialogVisible(false)
      await sleep(150)
      setIsShowSmallViewDialogRendering(false)
    }
  }, [])

  // Effects:
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 820
      setUseSmallView(prev => {
        if (prev !== isSmall) {
          return isSmall
        }
        return prev
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Return:
  return (
    <UtilitiesContext.Provider
      value={useMemo(() => ({
        useSmallView,
        setUseSmallView,
        isSmallViewDialogVisible,
        setIsShowSmallViewDialogVisible,
        isSmallViewDialogRendering,
        setIsShowSmallViewDialogRendering,
        isSidePanelPopoverOpen,
        setIsSidePanelPopoverOpen,
        isMOSDACDownDialogOpen,
        setIsMOSDACDownDialogOpen,
        toggleSmallViewDialog,
      }), [
        useSmallView,
        isSmallViewDialogVisible,
        isSmallViewDialogRendering,
        isSidePanelPopoverOpen,
        isMOSDACDownDialogOpen,
        toggleSmallViewDialog,
      ])}
    >
      {children}
    </UtilitiesContext.Provider>
  )
}

// Exports:
export default UtilitiesContext
