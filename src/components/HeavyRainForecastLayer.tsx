'use client'

// Packages:
import React, { memo } from 'react'
import ReactDOMServer from 'react-dom/server'
import L from 'leaflet'

// Typescript:
import type { RainPoint } from '@/lib/processCloudburstHeavyRain'

// Assets:
import { CloudRainWindIcon } from 'lucide-react'

// Components:
import { LayerGroup, Marker, Circle } from 'react-leaflet'

// Functions:
const _CloudRainWindIcon = new L.DivIcon({
  html: ReactDOMServer.renderToStaticMarkup(
    <CloudRainWindIcon className='w-6 h-6 text-indigo-500 fill-indigo-600 opacity-50' strokeWidth={1} />
  ),
  className: 'cloud-rain-wind-icon',
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

const HeavyRainForecastLayer = ({ data }: { data: RainPoint[] }) => (
  <LayerGroup>
    {data.map(datum => (
      <React.Fragment key={datum.id}>
        <Marker
          position={{ lat: datum.lat, lng: datum.lng }}
          icon={_CloudRainWindIcon}
        />
        <Circle
          center={{ lat: datum.lat, lng: datum.lng }}
          radius={datum.intensity * 1000}
          opacity={0.5}
        />
      </React.Fragment>
    ))}
  </LayerGroup>
)

// Exports:
export default memo(HeavyRainForecastLayer)
