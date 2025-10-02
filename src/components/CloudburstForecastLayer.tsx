'use client'

// Packages:
import React, { memo } from 'react'
import ReactDOMServer from 'react-dom/server'
import L from 'leaflet'

// Typescript:
import type { RainPoint } from '@/lib/processCloudburstHeavyRain'

// Assets:
import { CloudRainWindIcon, TriangleAlertIcon } from 'lucide-react'

// Components:
import { LayerGroup, Marker, Circle } from 'react-leaflet'

// Functions:
const _CloudRainWindTriangleAlertIcon = new L.DivIcon({
  html: ReactDOMServer.renderToStaticMarkup(
    <div className='relative w-10 h-10'>
      <CloudRainWindIcon className='w-10 h-10 text-rose-500 fill-rose-600' strokeWidth={1} />
      <TriangleAlertIcon className='absolute bottom-0 -right-2 w-5 h-5 text-white fill-rose-500' strokeWidth={2} />
    </div>
  ),
  className: 'cloud-rain-wind-triangle-alert-icon',
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
})

const CloudburstForecastLayer = ({ data }: { data: RainPoint[] }) => (
  <LayerGroup>
    {data.map(datum => (
      <React.Fragment key={datum.id}>
        <Marker
          position={{ lat: datum.lat, lng: datum.lng }}
          icon={_CloudRainWindTriangleAlertIcon}
        />
        <Circle
          center={{ lat: datum.lat, lng: datum.lng }}
          radius={datum.intensity * 1000}
          className='fill-rose-500 stroke-rose-800'
        />
      </React.Fragment>
    ))}
  </LayerGroup>
)

// Exports:
export default memo(CloudburstForecastLayer)
