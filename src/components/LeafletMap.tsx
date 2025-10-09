'use client'

// Packages:
import React, { Suspense, useContext, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay, useMapEvents } from 'react-leaflet'
import dynamic from 'next/dynamic'

// Typescript:
import { Layer } from './LayersCombobox'
import type { FirePoint } from '@/lib/toFirePoint'
import type { MOSDACWindVelocity } from '@/lib/toWindVelocityFormat'
import type { CloudburstHeavyRainProcessedData } from '@/lib/processCloudburstHeavyRain'
import type { MOSDACSnowInfo } from '@/pages/api/snow-info'

interface LeafletMapProps {
  windDirectionData: MOSDACWindVelocity | null
  fireSmokeData: FirePoint[] | null
  fireSmokeHeatmapData: HeatLatLngTuple[] | null
  cloudburstHeavyRainData: CloudburstHeavyRainProcessedData | null
  ripCurrentForecastData: string | null
  snowInfo: MOSDACSnowInfo | null
  snowImages: Map<string, string>
}

// Assets:
import 'leaflet-velocity/dist/leaflet-velocity.css'
import 'leaflet-velocity'

// Constants:
import { BOXES } from '@/lib/box'
import { CRS, HeatLatLngTuple, LatLngBoundsExpression } from 'leaflet'
const CENTER: google.maps.LatLngLiteral = { lat: 22, lng: 78 }
const ZOOM = 5

// Components:
import { ErrorBoundary } from 'react-error-boundary'
const WindLayer = dynamic(() => import('../components/WindLayer'), { ssr: false })
const WindHeatmapLayer = dynamic(() => import('../components/WindHeatmapLayer'), { ssr: false })
const FireSmokeLayer = dynamic(() => import('../components/FireSmokeLayer'), { ssr: false })
const FireSmokeHeatmapLayer = dynamic(() => import('../components/FireSmokeHeatmapLayer'), { ssr: false })
const HeavyRainLayer = dynamic(() => import('../components/HeavyRainLayer'), { ssr: false })
const HeavyRainForecastLayer = dynamic(() => import('../components/HeavyRainForecastLayer'), { ssr: false })
const CloudburstForecastLayer = dynamic(() => import('../components/CloudburstForecastLayer'), { ssr: false })

// Context:
import MapContext from '@/context/MapContext'

// Functions:
const DragWatcher = ({
  setIsDragging,
}: {
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  useMapEvents({
    dragstart: () => setIsDragging(true),
    dragend: () => setIsDragging(false),
  })
  return null
}

const LeafletMapErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallbackRender={() => <div>Something went wrong loading the map data</div>}
    >
      {children}
    </ErrorBoundary>
  )
}

const LeafletMapWithSuspense = (leafletMapProps: LeafletMapProps) => {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <LeafletMapErrorBoundary>
        <LeafletMap {...leafletMapProps} />
      </LeafletMapErrorBoundary>
    </Suspense>
  )
}

export const LeafletMap = ({
  windDirectionData,
  fireSmokeData,
  fireSmokeHeatmapData,
  cloudburstHeavyRainData,
  ripCurrentForecastData,
  snowInfo,
  snowImages,
}: LeafletMapProps) => {
  // Constants:
  const {
    layers,
    selectedLog,
    mode,
    opacity,
    images,
  } = useContext(MapContext)

  // State:
  const [isDragging, setIsDragging] = useState(false)
  
  // Memo:
  const windLayerOptions = useMemo(() => ({
    lineWidth: 2,
    particleMultiplier: .005,
    particleAge: 120,
    velocityScale: 0.007
  }), [])

  const ripCurrentForecastBounds = useMemo<LatLngBoundsExpression>(() => [
    [-51.7878, -24.5326],
    [72.5638, 187.9447]
  ], [])
  
  // Effects:
  useEffect(() => {
    const attributionDiv = document.getElementsByClassName('leaflet-control-attribution leaflet-control')[0] as HTMLDivElement | undefined
    if (attributionDiv) {
      const firstAnchor = attributionDiv.querySelector('a')
      const firstSpan = attributionDiv.querySelector('span')
      if (firstAnchor) firstAnchor.remove()
      if (firstSpan) firstSpan.remove()
    }
  }, [images])
  
  // Return:
  return (
    <MapContainer
      center={CENTER}
      zoom={ZOOM}
      scrollWheelZoom
      style={useMemo(() => ({
        width: '100%',
        height: 'calc(100% - 40px)',
      }), [])}
      zoomControl={false}
      crs={CRS.EPSG3857}
    >
      <DragWatcher setIsDragging={setIsDragging} />
      {
        images.size > 0 && (
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; OSM contributors | MOSDAC - ISRO'
          />
        )
      }
      {
        selectedLog !== null && BOXES.map((boxRow, index) => (
          <React.Fragment key={index}>
            {
              boxRow.map(box => {
                const url = images.get(box.bbox + mode + selectedLog.when.formatted)
                if (!url) return null

                return (
                  <ImageOverlay
                    key={box.bbox}
                    bounds={[
                      [box.bounds.south, box.bounds.west],
                      [box.bounds.north, box.bounds.east]
                    ]}
                    url={url}
                    opacity={opacity}
                  />
                )
              })
            }
          </React.Fragment>
        ))
      }
      {
        (layers.includes(Layer.WIND_DIRECTION) && windDirectionData !== null && !isDragging) && (
          <WindLayer
            wind={windDirectionData}
            options={windLayerOptions}
          />
        )
      }
      {
        (layers.includes(Layer.WIND_HEATMAP) && windDirectionData !== null) && (
          <WindHeatmapLayer data={windDirectionData.data} />
        )
      }
      {
        (layers.includes(Layer.FIRE_SMOKE) && fireSmokeData !== null) && (
          <FireSmokeLayer data={fireSmokeData} />
        )
      }
      {
        (layers.includes(Layer.FIRE_SMOKE_HEATMAP) && fireSmokeHeatmapData !== null) && (
          <FireSmokeHeatmapLayer data={fireSmokeHeatmapData} />
        )
      }
      {
        (layers.includes(Layer.HEAVY_RAIN) && cloudburstHeavyRainData !== null) && (
          <HeavyRainLayer data={cloudburstHeavyRainData.heavyRainPoints} />
        )
      }
      {
        (layers.includes(Layer.HEAVY_RAIN_FORECAST) && cloudburstHeavyRainData !== null) && (
          <HeavyRainForecastLayer data={cloudburstHeavyRainData.heavyRainForecastPoints} />
        )
      }
      {
        (layers.includes(Layer.CLOUDBURST_FORECAST) && cloudburstHeavyRainData !== null) && (
          <CloudburstForecastLayer data={cloudburstHeavyRainData.cloudburstPoints} />
        )
      }
      {
        (layers.includes(Layer.RIP_CURRENT_FORECAST) && ripCurrentForecastData) && (
          <ImageOverlay
            bounds={ripCurrentForecastBounds}
            url={ripCurrentForecastData}
          />
        )
      }
      {
        (layers.includes(Layer.SNOW) && selectedLog !== null && snowInfo !== null) && BOXES.map((boxRow, index) => (
          <React.Fragment key={index}>
            {
              boxRow.map(box => {
                const url = snowImages.get(box.bbox + mode + snowInfo.time + snowInfo.date + snowInfo.month + snowInfo.year + 'SNOW')
                if (!url) return null

                return (
                  <ImageOverlay
                    key={box.bbox}
                    bounds={[
                      [box.bounds.south, box.bounds.west],
                      [box.bounds.north, box.bounds.east]
                    ]}
                    url={url}
                  />
                )
              })
            }
          </React.Fragment>
        ))
      }
    </MapContainer>
  )
}

// Exports:
export default LeafletMapWithSuspense
