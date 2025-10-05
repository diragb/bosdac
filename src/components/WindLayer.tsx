'use client'

// Packages:
import { memo, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L, { Layer } from 'leaflet'

// Typescript:
import type { WindLayerProps } from '@/lib/toWindVelocityFormat'
import type { MOSDACWindParameterData } from '@/pages/api/wind-direction'

interface MockVelocityLayerLeaflet {
  velocityLayer: (options: Record<string, unknown>) => Layer
  addTo: (map: L.Map) => void
  remove: () => void
}

interface MockVelocityLayer extends L.Layer {
  setOptions?: (options: Record<string, unknown>) => void
  setData?: (data: [MOSDACWindParameterData, MOSDACWindParameterData]) => void
}

// Functions:
const WindLayer = ({ wind, options = {} }: WindLayerProps) => {
  // Constants:
  const map = useMap()

  // Ref:
  const layerRef = useRef<MockVelocityLayer | null>(null)

  // Effects:
  useEffect(() => {
    if (!map) return () => {}

    if (!layerRef.current) {
      const layer: Layer = (L as unknown as MockVelocityLayerLeaflet).velocityLayer({
        data: wind.data,
        minVelocity: wind.minVelocity,
        maxVelocity: wind.maxVelocity,
        velocityScale: wind.velocityScale,
        displayValues: false,
        ...(options as object),
      })
      layerRef.current = layer

      map.whenReady(() => {
        if (layerRef.current && (layerRef.current as unknown as MockVelocityLayerLeaflet).addTo && map) {
          try {
            (layerRef.current as unknown as MockVelocityLayerLeaflet).addTo(map)
          } catch {}
        }
      })
    }

    return () => {
      if (layerRef.current && (layerRef.current as unknown as MockVelocityLayerLeaflet).remove && map) {
        try {
          map.removeLayer(layerRef.current)
        } catch {}
      }
      layerRef.current = null
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    const layer = layerRef.current
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
