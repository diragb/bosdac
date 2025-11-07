// Packages:
import dynamic from 'next/dynamic'
import React, { useContext, useEffect } from 'react'
import localforage from 'localforage'

// Components:
import Footer from '@/components/Footer'
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })
import MOSDACDownDialog from '@/components/MOSDACDownDialog'
import SidePanel from '@/components/SidePanel'
import MobileSidePanel from '@/components/MobileSidePanel'

// Context:
import UtilitiesContext from '@/context/UtilitiesContext'

// Functions:
const BOSDAC = () => {
  // Constants:
  const { useSmallView } = useContext(UtilitiesContext)
  
  // Effects:
  useEffect(() => {
    localforage.config({
      driver: localforage.INDEXEDDB,
      name: 'bosdac',
      storeName: 'bosdac-cache'
    })
  }, [])

  // Return:
  return (
    <>
      <div className='relative w-screen h-screen bg-slate-400 overflow-hidden'>
        {
          useSmallView ? <MobileSidePanel /> : <SidePanel />
        }
        <LeafletMap />
        <Footer />
      </div>
      <MOSDACDownDialog />
    </>
  )
}

// Exports:
export default BOSDAC
