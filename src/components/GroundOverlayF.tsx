// Packages:
import { memo, useRef, useContext, useMemo, useEffect } from 'react'
import { type GroundOverlayProps, MapContext } from '@react-google-maps/api'

// Functions:
const GroundOverlay = ({
  url,
  bounds,
  options,
  visible,
}: GroundOverlayProps) => {
  const map = useContext<google.maps.Map | null>(MapContext)
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null)

  const imageBounds = useMemo(
    () =>
      new google.maps.LatLngBounds(
        new google.maps.LatLng(bounds.south, bounds.west),
        new google.maps.LatLng(bounds.north, bounds.east),
      ),
    [bounds.south, bounds.west, bounds.north, bounds.east],
  )

  useEffect(() => {
    if (!map) return
    overlayRef.current = new google.maps.GroundOverlay(
      url,
      imageBounds,
      { ...options, map },
    )
    return () => overlayRef.current?.setMap(null)
  }, [map, url, imageBounds, options])

  useEffect(() => {
    overlayRef.current?.set('url', url)
  }, [url])

  useEffect(() => {
    if (visible !== undefined)
      overlayRef.current?.setOpacity(visible ? 1 : 0)
  }, [visible])

  useEffect(() => {
    overlayRef.current?.set('bounds', imageBounds)
  }, [imageBounds])

  return null
}

// Exports:
export const GroundOverlayF = memo(GroundOverlay)
