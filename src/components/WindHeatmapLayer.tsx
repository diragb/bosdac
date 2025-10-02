'use client'

// Packages:
import { memo, useEffect, useMemo, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

// Typescript:
import type { MOSDACWindParameterData } from '@/pages/api/mosdac-wind-direction'

interface WindHeatmapLayerProps {
  data: [MOSDACWindParameterData, MOSDACWindParameterData]
  intensity?: (mps: number) => number
}

const WindHeatmapLayer = ({ data: [uField, vField], intensity }: WindHeatmapLayerProps) => {
  // Constants:
  const map = useMap()

  // Ref:
  const layerRef = useRef<any | null>(null)

  // Memo:
  const intensityFn = useMemo(() => intensity ?? ((s: number) => s / 40), [intensity])

  // Effects:
  useEffect(() => {
    if (!map) return () => {}

    if (!layerRef.current) {
      const layer = (L as any).heatLayer([], {
        radius: 15,
        blur: 20,
        maxZoom: 6,
      })

      layerRef.current = layer
      map.whenReady(() => {
        try {
          layer.addTo(map)
        } catch {}
      })
    }

    return () => {
      if (layerRef.current) {
        try {
          map.removeLayer(layerRef.current)
        } catch {}
      }
      layerRef.current = null
    }
  }, [map])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const { nx, ny, lo1, la1, dx, dy } = uField.header
    const pts: [number, number, number][] = []

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const idx = y * nx + x
        const u = uField.data[idx]
        const v = vField.data[idx]
        const speed = Math.hypot(u, v)
        const lat = la1 - y * dy
        const lng = lo1 + x * dx
        pts.push([lat, lng, intensityFn(speed)])
      }
    }

    try {
      if (typeof layer.setLatLngs === 'function') {
        layer.setLatLngs(pts)
      } else {
        map.removeLayer(layer)
        const newLayer = (L as any).heatLayer(pts, layer.options || {})
        newLayer.addTo(map)
        layerRef.current = newLayer
      }
    } catch {}
  }, [uField, vField, intensityFn, map])

  // Return:
  return null
}

// Exports:
export default memo(WindHeatmapLayer)
