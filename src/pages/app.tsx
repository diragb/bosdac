// Packages:
import dynamic from 'next/dynamic'
import React, { useEffect } from 'react'
import localforage from 'localforage'

// Components:
import Head from 'next/head'
import AnimationOverlay from '@/components/AnimationOverlay'
import Footer from '@/components/Footer'
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })
import MOSDACDownDialog from '@/components/MOSDACDownDialog'
import SidePanel from '@/components/SidePanel'
import AnimationFrameGenerator from '@/components/AnimationFrameGenerator'

// Context:
import { UtilitiesContextProvider } from '@/context/UtilitiesContext'
import { GlobalAnimationContextProvider } from '@/context/GlobalAnimationContext'
import { AnimationContextProvider } from '@/context/AnimationContext'
import { MapContextProvider } from '@/context/MapContext'
import { LayersContextProvider } from '@/context/LayersContext'

// Functions:
const BOSDAC = () => {
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
    <UtilitiesContextProvider>
      <GlobalAnimationContextProvider>
        <MapContextProvider>
          <AnimationContextProvider>
            <LayersContextProvider>
              <AnimationFrameGenerator />
              <Head>
                <title>BOSDAC - Better MOSDAC</title>
              </Head>
              <div className='relative w-screen h-screen bg-slate-400 overflow-hidden'>
                <AnimationOverlay />
                <SidePanel />
                <LeafletMap />
                <Footer />
              </div>
              <MOSDACDownDialog />
            </LayersContextProvider>
          </AnimationContextProvider>
        </MapContextProvider>
      </GlobalAnimationContextProvider>
    </UtilitiesContextProvider>
  )
}

// Exports:
export default BOSDAC
