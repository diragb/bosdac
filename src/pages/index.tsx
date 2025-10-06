// Packages:
import dynamic from 'next/dynamic'
import React, { useState } from 'react'

// Typescript:
import { Layer } from '@/components/LayersCombobox'
import type { MOSDACLog } from './api/log'
import { MOSDACImageMode } from './api/history'
import type { MOSDACWindVelocity } from '@/lib/toWindVelocityFormat'
import type { FirePoint } from '@/lib/toFirePoint'
import type { HeatLatLngTuple } from 'leaflet'
import type { CloudburstHeavyRainProcessedData } from '@/lib/processCloudburstHeavyRain'
import type { MOSDACSnowInfo } from './api/snow-info'

// Components:
import Footer from '@/components/Footer'
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })
import MOSDACDownDialog from '@/components/MOSDACDownDialog'
import SidePanel from '@/components/SidePanel'

// Functions:
const Leaflet = () => {
  // State:
  const [isMOSDACDownDialogOpen, setIsMOSDACDownDialogOpen] = useState(false)
  const [layers, setLayers] = useState<Layer[]>([])
  const [windDirectionData, setWindDirectionData] = useState<MOSDACWindVelocity | null>(null)
  const [fireSmokeData, setFireSmokeData] = useState<FirePoint[] | null>(null)
  const [fireSmokeHeatmapData, setFireSmokeHeatmapData] = useState<HeatLatLngTuple[] | null>(null)
  const [cloudburstHeavyRainData, setCloudburstHeavyRainData] = useState<CloudburstHeavyRainProcessedData | null>(null)
  const [ripCurrentForecastData, setRipCurrentForecastData] = useState<string | null>(null)
  const [snowInfo, setSnowInfo] = useState<MOSDACSnowInfo | null>(null)
  const [snowImages, setSnowImages] = useState<Map<string, string>>(new Map())
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [selectedLog, setSelectedLog] = useState<MOSDACLog | null>(null)
  const [mode, setMode] = useState<MOSDACImageMode>(MOSDACImageMode.GREYSCALE)
  const [opacity, setOpacity] = useState(0.85)

  // Return:
  return (
    <>
      <div className='relative w-screen h-screen bg-slate-400 overflow-hidden'>
        <SidePanel
          setIsMOSDACDownDialogOpen={setIsMOSDACDownDialogOpen}
          layers={layers}
          setLayers={setLayers}
          windDirectionData={windDirectionData}
          setWindDirectionData={setWindDirectionData}
          fireSmokeData={fireSmokeData}
          setFireSmokeData={setFireSmokeData}
          fireSmokeHeatmapData={fireSmokeHeatmapData}
          setFireSmokeHeatmapData={setFireSmokeHeatmapData}
          cloudburstHeavyRainData={cloudburstHeavyRainData}
          setCloudburstHeavyRainData={setCloudburstHeavyRainData}
          ripCurrentForecastData={ripCurrentForecastData}
          setRipCurrentForecastData={setRipCurrentForecastData}
          snowInfo={snowInfo}
          setSnowInfo={setSnowInfo}
          snowImages={snowImages}
          setSnowImages={setSnowImages}
          images={images}
          setImages={setImages}
          selectedLog={selectedLog}
          setSelectedLog={setSelectedLog}
          mode={mode}
          setMode={setMode}
          opacity={opacity}
          setOpacity={setOpacity}
        />
        <LeafletMap
          images={images}
          mode={mode}
          opacity={opacity}
          selectedLog={selectedLog}
          layers={layers}
          windDirectionData={windDirectionData}
          fireSmokeData={fireSmokeData}
          fireSmokeHeatmapData={fireSmokeHeatmapData}
          cloudburstHeavyRainData={cloudburstHeavyRainData}
          ripCurrentForecastData={ripCurrentForecastData}
          snowInfo={snowInfo}
          snowImages={snowImages}
        />
        <Footer />
      </div>
      <MOSDACDownDialog isOpen={isMOSDACDownDialogOpen} onOpenChange={setIsMOSDACDownDialogOpen} />
    </>
  )
}

// Exports:
export default Leaflet
