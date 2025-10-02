'use client'

// Packages:
import { memo, useEffect, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import 'leaflet.heat'

// Typescript:
import type { RainPoint } from '@/lib/processCloudburstHeavyRain'

// Constants:
const bucket = 0.02

// Functions:
const HeavyRainLayer = ({ data }: { data: RainPoint[] }) => {
  // Constants:
  const map = useMap()

  // Memo:
  const aggregatePoints = useMemo(() => {
    const buckets = new Map<string, [number, number, number]>()
    
    for (const datum of data) {
      const key = `${(Math.round(datum.lat / bucket) * bucket).toFixed(2)}_` +
        `${(Math.round(datum.lng / bucket) * bucket).toFixed(2)}`
      const existing = buckets.get(key)
      if (existing) {
        existing[2] += datum.intensity
      } else {
        buckets.set(key, [datum.lat, datum.lng, datum.intensity])
      }
    }

    const values = [...buckets.values()]
    const max = values.length ? Math.max(...values.map(v => v[2])) : 1
    return values.map(v => [v[0], v[1], v[2] / (max || 1)] as [number, number, number])
  }, [data])

  // Effects:
  useEffect(() => {
    const layer = window.L.heatLayer(aggregatePoints, {
      radius: 25,
      blur: 15,
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
export default memo(HeavyRainLayer)
