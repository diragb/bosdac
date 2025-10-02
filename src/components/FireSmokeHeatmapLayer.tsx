'use client'

// Packages:
import { memo, useEffect, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet.heat'

// Typescript:
import type { HeatLatLngTuple } from 'leaflet'

// Constants:
const bucket = 0.02

// Functions:
const FireSmokeHeatmapLayer = ({ data }: { data: HeatLatLngTuple[] }) => {
  // Constants:
  const map = useMap()

  // Memo:
  const aggregatePoints = useMemo(() => {
    const counts = new Map<string, HeatLatLngTuple>()

    data.forEach(([lat, lng]) => {
      const key =
        `${(Math.round(lat / bucket) * bucket).toFixed(2)}_` +
        `${(Math.round(lng / bucket) * bucket).toFixed(2)}`

      const c = counts.get(key)
      if (c) c[2]++
      else counts.set(key, [lat, lng, 1])
    })

    const max = Math.max(...[...counts.values()].map(v => v[2]))

    return [...counts.values()].map(v => [v[0], v[1], v[2] / max] as [number, number, number])
  }, [data])

  // Effects:
  useEffect(() => {
    const layer = window.L.heatLayer(aggregatePoints, {
      radius: 25,
      blur: 18,
      maxZoom: 11,
      gradient: {
        0.2: '#00f',
        0.4: '#0f0',
        0.6: '#ff0',
        0.8: '#f80',
        1.0: '#f00',
      },
    }).addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [aggregatePoints, map])

  // Return:
  return null
}

// Exports:
export default memo(FireSmokeHeatmapLayer)
