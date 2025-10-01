'use client'

// Packages:
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet'

// Typescript:
import type { MOSDACLog } from '../pages/api/mosdac-log'
import { MOSDACImageMode } from '../pages/api/mosdac'

// Constants:
import { BOXES } from '@/pages/leaflet'
import { CRS } from 'leaflet'
const CENTER: google.maps.LatLngLiteral = { lat: 22, lng: 78 }
const ZOOM = 5

// Functions:
const LeafletMap = ({
  images,
  selectedLog,
  mode,
  opacity,
}: {
  images: Map<string, string>
  selectedLog: MOSDACLog | null
  mode: MOSDACImageMode
  opacity: number
}) => {
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
      style={{
        width: '100%',
        height: 'calc(100% - 40px)',
      }}
      zoomControl={false}
      crs={CRS.EPSG3857}
    >
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
      {/* {
        selectedLog !== null && touchedLogsQueue.map(touchedLog => (
          <React.Fragment key={`outer-${touchedLog.name}`}>
            {
              BOXES.map((boxRow, index) => (
                <React.Fragment key={index}>
                  {
                    boxRow.map(box => {
                      const key = box.bbox + mode + selectedLog.when.formatted
                      const url = images.get(key)
                      if (!url) return null

                      return (
                        <ImageOverlay
                          key={key}
                          bounds={[
                            [box.bounds.south, box.bounds.west],
                            [box.bounds.north, box.bounds.east]
                          ]}
                          url={url}
                          opacity={selectedLog?.name === touchedLog.name ? opacity : 0}
                        />
                      )
                    })
                  }
                </React.Fragment>
              ))
            }
          </React.Fragment>
        ))
      } */}
    </MapContainer>
  )
}

// Exports:
export default LeafletMap
