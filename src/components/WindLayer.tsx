'use client'

// Packages:
import { memo, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L, { Layer } from 'leaflet'

// Typescript:
import { WindLayerProps } from '@/lib/toWindVelocityFormat'

// Functions:
const WindLayer = ({ wind, options = {} }: WindLayerProps) => {
  // Constants:
  const map = useMap()

  // Ref:
  const layerRef = useRef<Layer | null>(null)

  // Effects:
  useEffect(() => {
    if (!map) return () => {}

    if (!layerRef.current) {
      const layer: Layer = (L as any).velocityLayer({
        data: wind.data,
        minVelocity: wind.minVelocity,
        maxVelocity: wind.maxVelocity,
        velocityScale: wind.velocityScale,
        displayValues: false,
        ...(options as object),
      })
      layerRef.current = layer

      map.whenReady(() => {
        if (layerRef.current && (layerRef.current as any).addTo && map) {
          try {
            (layerRef.current as any).addTo(map)
          } catch {}
        }
      })
    }

    return () => {
      if (layerRef.current && (layerRef.current as any).remove && (map as any)) {
        try {
          map.removeLayer(layerRef.current)
        } catch {}
      }
      layerRef.current = null
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    const layer = layerRef.current as any
    if (!layer) return

    if (typeof layer.setOptions === 'function') {
      try {
        layer.setOptions({
          minVelocity: wind.minVelocity,
          maxVelocity: wind.maxVelocity,
          velocityScale: wind.velocityScale,
          ...(options as object),
        })
      } catch {}
    }

    if (typeof layer.setData === 'function') {
      try {
        layer.setData(wind.data)
      } catch {}
    }
  }, [wind, options])

  // Return:
  return null
}

// Exports:
export default memo(WindLayer)
