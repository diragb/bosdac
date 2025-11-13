'use client'

// Packages:
import React, { Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay, useMapEvents, useMap } from 'react-leaflet'
import dynamic from 'next/dynamic'
import { cloneDeep } from 'lodash'
import { cn } from '@/lib/utils'

// Typescript:
import { Layer } from './LayersCombobox'

// Assets:
import 'leaflet-velocity/dist/leaflet-velocity.css'
import 'leaflet-velocity'

// Constants:
import { BOXES } from '@/lib/box'
import { CRS, LatLngBoundsExpression } from 'leaflet'
const CENTER: google.maps.LatLngLiteral = { lat: 22, lng: 78 }


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
import LayersContext from '@/context/LayersContext'
import AnimationContext from '@/context/AnimationContext'

// Functions:
const DragWatcher = ({
  setIsDragging,
}: {
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  // Effects:
  useMapEvents({
    dragstart: () => setIsDragging(true),
    dragend: () => setIsDragging(false),
  })

  // Return:
  return null
}

const ZoomWatcher = ({
  setIsZooming,
  setZoom,
}: {
  setIsZooming: React.Dispatch<React.SetStateAction<boolean>>
  setZoom: React.Dispatch<React.SetStateAction<number>>
}) => {
  // Effects:
  useMapEvents({
    zoom: event => {
      setIsZooming(true)
      setZoom(event.target._zoom)
    },
    zoomend: () => setIsZooming(false),
  })

  // Return:
  return null
}

const ImperativeZoom = ({
  zoom,
  shouldImperativeZoom,
}: {
  zoom: number
  shouldImperativeZoom: boolean
}) => {
  // Constants:
  const map = useMap()

  // Effects:
  useEffect(() => {
    if (shouldImperativeZoom) map.setZoom(zoom)
  }, [zoom, shouldImperativeZoom])

  // Return:
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

const LeafletMapWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <LeafletMapErrorBoundary>
        <LeafletMap />
      </LeafletMapErrorBoundary>
    </Suspense>
  )
}

export const LeafletMap = () => {
  // Ref:
  const imageOverlaysRef = useRef<HTMLImageElement[][]>([])
  const imageOverlayBoundingBoxesRef = useRef<DOMRect[][]>([])

  // Constants:
  const {
    layers,
    selectedLog,
    mode,
    opacity,
    images,
    zoom,
    setZoom,
  } = useContext(MapContext)
  const {
    windDirectionData,
    fireSmokeData,
    fireSmokeHeatmapData,
    cloudburstHeavyRainData,
    ripCurrentForecastData,
    snowInfo,
    snowImages,
  } = useContext(LayersContext)
  const {
    showTimelapseRecordingControls,
    selectedTiles,
    setSelectedTiles,
  } = useContext(AnimationContext)

  // State:
  const [isDragging, setIsDragging] = useState(false)
  const [isZooming, setIsZooming] = useState(false)
  const [imageOverlayBoundingBoxes, setImageOverlayBoundingBoxes] = useState<DOMRect[][]>([])
  
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

  useEffect(() => {
    if (showTimelapseRecordingControls) setImageOverlayBoundingBoxes(cloneDeep(imageOverlayBoundingBoxesRef.current))
  }, [showTimelapseRecordingControls, isZooming])
  
  // Return:
  return (
    <>
      {
        showTimelapseRecordingControls && (
          <div className='absolute z-[1000] w-screen h-screen'>
            {
              imageOverlayBoundingBoxes.map((boundingBoxRow, index) => (
                <React.Fragment key={index}>
                  {
                    boundingBoxRow.map((boundingBox, jindex) => {
                      const key = `${index}-${jindex}`
                      const box = BOXES[index][jindex]

                      return (
                        <div
                          key={jindex}
                          className={cn(
                            'absolute border-[1px] border-zinc-700 border-dashed cursor-pointer transition-colors',
                            selectedTiles.has(key) ? 'bg-emerald-400/20' : 'bg-zinc-600/30',
                            (box.length > 1 || box.breadth > 1) && 'opacity-20',
                          )}
                          style={{
                            top: boundingBox.top,
                            left: boundingBox.left,
                            width: boundingBox.width,
                            height: boundingBox.height,
                          }}
                          onClick={() => {
                            if (box.length > 1 || box.breadth > 1) return
                            setSelectedTiles(_selectedTiles => {
                              const newSelectedTiles = new Set(_selectedTiles)
                              if (newSelectedTiles.has(key)) newSelectedTiles.delete(key)
                              else newSelectedTiles.add(key)
                              return newSelectedTiles
                            })
                          }}
                        />
                      )
                    })
                  }
                </React.Fragment>
              ))
            }
          </div>
        )
      }
      <MapContainer
        center={CENTER}
        zoom={zoom}
        scrollWheelZoom
        style={useMemo(() => ({
          width: '100%',
          height: 'calc(100% - 40px)',
        }), [])}
        zoomControl={false}
        crs={CRS.EPSG3857}
        preferCanvas
        dragging
      >
        <DragWatcher setIsDragging={setIsDragging} />
        <ZoomWatcher
          setIsZooming={setIsZooming}
          setZoom={setZoom}
        />
        <ImperativeZoom
          shouldImperativeZoom={showTimelapseRecordingControls}
          zoom={zoom}
        />
        {
          images.size > 0 && (
            <TileLayer
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              attribution='&copy; OSM contributors | MOSDAC - ISRO'
            />
          )
        }
        {
          selectedLog !== null && BOXES.map((boxRow, index) => {
            if (imageOverlaysRef.current[index] === undefined) imageOverlaysRef.current[index] = []
            if (imageOverlayBoundingBoxesRef.current[index] === undefined) imageOverlayBoundingBoxesRef.current[index] = []

            return (
              <React.Fragment key={index}>
                {
                  boxRow.map((box, jindex) => {
                    const url = images.get(box.bbox + mode + selectedLog.when.formatted)
                    if (!url) return null
    
                    return (
                      <ImageOverlay
                        ref={imageOverlay => {
                          if (!imageOverlay) return
                          const element = imageOverlay.getElement()
                          if (!element) return
                          imageOverlaysRef.current[index][jindex] = element
                          imageOverlayBoundingBoxesRef.current[index][jindex] = element.getBoundingClientRect()
                        }}
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
            )
          })
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
    </>
  )
}

// Exports:
export default LeafletMapWithSuspense
