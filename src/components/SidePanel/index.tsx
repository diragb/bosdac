// Packages:
import React, { useContext } from 'react'

// Components:
import MobileSidePanel from './MobileSidePanel'
import SidePanelPrimitive from './SidePanelPrimitive'

// Context:
import UtilitiesContext from '@/context/UtilitiesContext'

// Functions:
const SidePanel = () => {
  // Constants:
  const { useSmallView } = useContext(UtilitiesContext)

  // Return:
  return useSmallView ? <MobileSidePanel /> : <SidePanelPrimitive />
}

// Exports:
export default SidePanel
