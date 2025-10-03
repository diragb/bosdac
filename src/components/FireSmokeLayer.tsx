'use client'

// Packages:
import { memo } from 'react'
import ReactDOMServer from 'react-dom/server'
import L from 'leaflet'

// Typescript:
import type { FirePoint } from '@/lib/toFirePoint'

// Assets:
import { FlameIcon } from 'lucide-react'

// Components:
import { LayerGroup, Marker } from 'react-leaflet'

// Functions:
const _FlameIcon = new L.DivIcon({
  html: ReactDOMServer.renderToStaticMarkup(
    <FlameIcon className='w-6 h-6 text-rose-400 fill-orange-600' strokeWidth={1} />
  ),
  className: 'fire-icon',
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

const FireSmokeLayer = ({ data }: { data: FirePoint[] }) => (
  <LayerGroup>
    {data.map(datum => (
      <Marker key={datum.id} position={{ lat: datum.lat, lng: datum.lng }} icon={_FlameIcon} />
    ))}
  </LayerGroup>
)

// Exports:
export default memo(FireSmokeLayer)
