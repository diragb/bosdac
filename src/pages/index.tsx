// Packages:
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { cn } from '@/lib/utils'
import localforage from 'localforage'
import toFirePoint from '@/lib/toFirePoint'
import toWindVelocityFormat from '@/lib/toWindVelocityFormat'

// Typescript:
import type { MOSDACWindDirectionData } from './api/mosdac-wind-direction'
import type { MOSDACLogData, MOSDACLog } from './api/mosdac-log'
import { MOSDACImageMode } from './api/mosdac'
import type { MOSDACWindVelocity } from '@/lib/toWindVelocityFormat'
import type { MOSDACFireSmoke } from './api/mosdac-fire-smoke'
import type { FirePoint } from '@/lib/toFirePoint'

// Classes:
class Box {
  bbox = ''
  bounds = {
    north: 0,
    east: 0,
    south: 0,
    west: 0,
  }

  constructor(bbox: string, bounds: google.maps.LatLngBoundsLiteral) {
    this.bbox = bbox
    this.bounds = bounds
  }
}

// Constants:
const ADJUSTMENTS = [0, 0, 0, 0, 0, 0] as const
export const BOXES = [
  [
    new Box('918385.800,5675870.433,4202310.778,9459784.055', {north:64.4299080496+ADJUSTMENTS[0],east:37.7500000054,south:45.3441870900+ADJUSTMENTS[1],west:8.2500000090}),
    new Box('4202310.778,5675870.433,7486235.756,9459784.055', {north:64.4299080496+ADJUSTMENTS[0],east:67.2500000018,south:45.3441870900+ADJUSTMENTS[1],west:37.7500000054}),
    new Box('7486235.756,5675870.433,10770160.734,9459784.055', {north:64.4299080496+ADJUSTMENTS[0],east:96.7499999982,south:45.3441870900+ADJUSTMENTS[1],west:67.2500000018}),
    new Box('10770160.734,5675870.433,14054085.712,9459784.055', {north:64.4299080496+ADJUSTMENTS[0],east:126.2499999946,south:45.3441870900+ADJUSTMENTS[1],west:96.7499999982}),
    new Box('14054085.712,5675870.433,17338010.690,9459784.055', {north:64.4299080496+ADJUSTMENTS[0],east:155.7499999910,south:45.3441870900+ADJUSTMENTS[1],west:126.2499999946}),
  ],
  [
    new Box('918385.800,1891956.811,4202310.778,5675870.433', {north:45.34418709+ADJUSTMENTS[1],east:37.7500000054,south:16.7518402863+ADJUSTMENTS[2],west:8.2500000090}),
    new Box('4202310.778,1891956.811,7486235.756,5675870.433', {north:45.34418709+ADJUSTMENTS[1],east:67.2500000018,south:16.7518402863+ADJUSTMENTS[2],west:37.7500000054}),
    new Box('7486235.756,1891956.811,10770160.734,5675870.433', {north:45.34418709+ADJUSTMENTS[1],east:96.7499999982,south:16.7518402863+ADJUSTMENTS[2],west:67.2500000018}),
    new Box('10770160.734,1891956.811,14054085.712,5675870.433', {north:45.34418709+ADJUSTMENTS[1],east:126.2499999946,south:16.7518402863+ADJUSTMENTS[2],west:96.7499999982}),
    new Box('14054085.712,1891956.811,17338010.690,5675870.433', {north:45.34418709+ADJUSTMENTS[1],east:155.7499999910,south:16.7518402863+ADJUSTMENTS[2],west:126.2499999946}),
  ],
  [
    new Box('-2365539.178,-1891956.811,918385.800,1891956.811', {north:16.7518402863+ADJUSTMENTS[2],east:8.2500000090,south:-16.7518402863+ADJUSTMENTS[3],west:-21.2499999874}),
    new Box('918385.800,-1891956.811,4202310.778,1891956.811', {north:16.7518402863+ADJUSTMENTS[2],east:37.7500000054,south:-16.7518402863+ADJUSTMENTS[3],west:8.2500000090}),
    new Box('4202310.778,-1891956.811,7486235.756,1891956.811', {north:16.7518402863+ADJUSTMENTS[2],east:67.2500000018,south:-16.7518402863+ADJUSTMENTS[3],west:37.7500000054}),
    new Box('7486235.756,-1891956.811,10770160.734,1891956.811', {north:16.7518402863+ADJUSTMENTS[2],east:96.7499999982,south:-16.7518402863+ADJUSTMENTS[3],west:67.2500000018}),
    new Box('10770160.734,-1891956.811,14054085.712,1891956.811', {north:16.7518402863+ADJUSTMENTS[2],east:126.2499999946,south:-16.7518402863+ADJUSTMENTS[3],west:96.7499999982}),
    new Box('14054085.712,-1891956.811,17338010.690,1891956.811', {north:16.7518402863+ADJUSTMENTS[2],east:155.7499999910,south:-16.7518402863+ADJUSTMENTS[3],west:126.2499999946}),
    new Box('17338010.690,-1891956.811,19954018.725,1891956.811', {north:16.7518402863+ADJUSTMENTS[2],east:179.2500000032,south:-16.7518402863+ADJUSTMENTS[3],west:155.7499999910}),
  ],
  [
    new Box('918385.800,-5675870.433,4202310.778,-1891956.811', {north:-16.7518402863+ADJUSTMENTS[3],east:37.7500000054,south:-45.34418709+ADJUSTMENTS[4],west:8.2500000090}),
    new Box('4202310.778,-5675870.433,7486235.756,-1891956.811', {north:-16.7518402863+ADJUSTMENTS[3],east:67.2500000018,south:-45.34418709+ADJUSTMENTS[4],west:37.7500000054}),
    new Box('7486235.756,-5675870.433,10770160.734,-1891956.811', {north:-16.7518402863+ADJUSTMENTS[3],east:96.7499999982,south:-45.34418709+ADJUSTMENTS[4],west:67.2500000018}),
    new Box('10770160.734,-5675870.433,14054085.712,-1891956.811', {north:-16.7518402863+ADJUSTMENTS[3],east:126.2499999946,south:-45.34418709+ADJUSTMENTS[4],west:96.7499999982}),
    new Box('14054085.712,-5675870.433,17338010.690,-1891956.811', {north:-16.7518402863+ADJUSTMENTS[3],east:155.7499999910,south:-45.34418709+ADJUSTMENTS[4],west:126.2499999946}),
  ],
  [
    new Box('918385.800,-9459784.055,4202310.778,-5675870.433', {north:-45.34418709+ADJUSTMENTS[4],east:37.7500000054,south:-64.4299080496+ADJUSTMENTS[5],west:8.2500000090}),
    new Box('4202310.778,-9459784.055,7486235.756,-5675870.433', {north:-45.34418709+ADJUSTMENTS[4],east:67.2500000018,south:-64.4299080496+ADJUSTMENTS[5],west:37.7500000054}),
    new Box('7486235.756,-9459784.055,10770160.734,-5675870.433',{north:-45.34418709+ADJUSTMENTS[4],east:96.7499999982,south:-64.4299080496+ADJUSTMENTS[5],west:67.2500000018}),
    new Box('10770160.734,-9459784.055,14054085.712,-5675870.433',{north:-45.34418709+ADJUSTMENTS[4],east:126.2499999946,south:-64.4299080496+ADJUSTMENTS[5],west:96.7499999982}),
    new Box('14054085.712,-9459784.055,17338010.690,-5675870.433',{north:-45.34418709+ADJUSTMENTS[4],east:155.7499999910,south:-64.4299080496+ADJUSTMENTS[5],west:126.2499999946}),
  ],
] as const

// Components:
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import LayersCombobox, { Layer } from '@/components/LayersCombobox'
import HistoryCombobox from '@/components/HistoryCombobox'
import LegendsCombobox from '@/components/ModesCombobox'
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })
import { Slider } from '@/components/ui/slider'
import { HeatLatLngTuple } from 'leaflet'

// Functions:
const Leaflet = () => {
  // State:
  const [layers, setLayers] = useState<Layer[]>([])
  const [windDirectionData, setWindDirectionData] = useState<MOSDACWindVelocity | null>(null)
  const [isFetchingWindDirectionData, setIsFetchingWindDirectionData] = useState(false)
  const [fireSmokeData, setFireSmokeData] = useState<FirePoint[] | null>(null)
  const [isFetchingFireSmokeData, setIsFetchingFireSmokeData] = useState(false)
  const [fireSmokeHeatmapData, setFireSmokeHeatmapData] = useState<HeatLatLngTuple[] | null>(null)
  const [layerFetchingStatus, setLayerFetchingStatus] = useState<Map<Layer, boolean>>(new Map())
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [isFetchingImages, setIsFetchingImages] = useState(false)
  const [historicalLogsFetchingStatus, setHistoricalLogsFetchingStatus] = useState<Map<string, number>>(new Map())
  const [logs, setLogs] = useState<MOSDACLogData>([])
  const [selectedLog, setSelectedLog] = useState<MOSDACLog | null>(null)
  const [mode, setMode] = useState<MOSDACImageMode>(MOSDACImageMode.GREYSCALE)
  const [modeFetchingStatus, setModeFetchingStatus] = useState<Map<MOSDACImageMode, number>>(new Map())
  const [opacity, setOpacity] = useState(0.85)
  const [isAnimationOn, setIsAnimationOn] = useState(false)

  // Functions:
  const sortLogs = (logs: MOSDACLogData) => {
    const MONTH_TO_NUM: Record<string, number> = {
      JAN: 1,
      FEB: 2,
      MAR: 3,
      APR: 4,
      MAY: 5,
      JUN: 6,
      JUL: 7,
      AUG: 8,
      SEP: 9,
      OCT: 10,
      NOV: 11,
      DEC: 12,
    }

    const toSortableKey = (log: MOSDACLog) => {
      const year = parseInt(log.when.year, 10)
      const month = MONTH_TO_NUM[log.when.month.toUpperCase()] ?? 0
      const date = parseInt(log.when.date, 10)

      const time = log.when.time.padStart(4, '0')
      const hours = parseInt(time.slice(0, 2), 10)
      const minutes = parseInt(time.slice(2), 10)

      return year * 1e8 + month * 1e6 + date * 1e4 + hours * 1e2 + minutes
    }

    return [...logs].sort((a, b) => toSortableKey(b) - toSortableKey(a))
  }

  const getMOSDACLogData = async () => {
    try {
      const { data } = await axios.get('/api/mosdac-log')
      if (Array.isArray(data)) {
        const sortedLogs = sortLogs(data)
        setLogs(sortedLogs)
        setSelectedLog(sortedLogs[0])
        onLogSelect(sortedLogs[0])
      }
      else throw new Error(data)
    } catch (error) {
      console.error(error)
    }
  }

  const getMOSDACImageURL = (box: Box, log: MOSDACLog, mode: MOSDACImageMode) => {
    return `/api/mosdac?bbox=${box.bbox}&date=${log.when.date}&month=${log.when.month}&year=${log.when.year}&formattedTimestamp=${log.when.formatted}&mode=${mode}`
  }

  const fetchMOSDACImages = async (log: MOSDACLog, mode: MOSDACImageMode, forProperty: 'log' | 'mode' = 'log') => {
    try {
      let fetchedImageCount = 0
      const existingImages = new Map(images)
      const requests: Array<Promise<{ key: string, url: string }>> = []

      for (const boxRow of BOXES) {
        for (const box of boxRow) {
          const key = box.bbox + mode + log.when.formatted
          if (existingImages.has(key)) continue

          const imageURL = getMOSDACImageURL(box, log, mode)
          const request = new Promise<{ key: string, url: string }>(resolve => {
            localforage.getItem<Blob>(key).then(image => {
              if (image !== null) resolve({ key, url: URL.createObjectURL(image) })
              else {
                axios
                  .get<Blob>(imageURL, { responseType: 'blob' })
                  .then(({ data }) => {
                    try {
                      localforage.setItem(key, data)
                    } catch (error) {
                      if (
                        (error as Error).name.includes('QuotaExceededError') ||
                        (error as Error).message.includes('QuotaExceededError')
                      ) {
                        localforage.clear()
                      }
                    }

                    resolve({ key, url: URL.createObjectURL(data) })
                  })
              }
            })
          })
          requests.push(request)
        }
      }

      if (requests.length > 0) setIsFetchingImages(true)

      for (const request of requests) {
        request.then(({ key, url }) => {
          if (forProperty === 'log') {
            setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
              const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
              newHistoricalLogsFetchingStatus.set(log.name, ++fetchedImageCount/requests.length)
              return newHistoricalLogsFetchingStatus
            })
          } else if (forProperty === 'mode') {
            setModeFetchingStatus(_modeFetchingStatus => {
              const newModeFetchingStatus = new Map(_modeFetchingStatus)
              newModeFetchingStatus.set(mode, ++fetchedImageCount/requests.length)
              return newModeFetchingStatus
            })
          }
          setImages(prev => {
            const next = new Map(prev)
            next.set(key, url)
            return next
          })
        }).catch(() => {
        })
      }

      await Promise.allSettled(requests)
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetchingImages(false)
    }
  }

  const onLogSelect = (log: MOSDACLog) => {
    setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
      const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
      newHistoricalLogsFetchingStatus.set(log.name, 0)
      return newHistoricalLogsFetchingStatus
    })
    setSelectedLog(log)
    fetchMOSDACImages(log, mode, 'log').then(() => {
      setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
        const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
        newHistoricalLogsFetchingStatus.delete(log.name)
        return newHistoricalLogsFetchingStatus
      })
    })
  }

  const onModeSelect = (mode: MOSDACImageMode) => {
    if (!selectedLog) return
    setModeFetchingStatus(_modeFetchingStatus => {
      const newModeFetchingStatus = new Map(_modeFetchingStatus)
      newModeFetchingStatus.set(mode, 0)
      return newModeFetchingStatus
    })
    setMode(mode)
    fetchMOSDACImages(selectedLog, mode, 'mode').then(() => {
      setModeFetchingStatus(_modeFetchingStatus => {
        const newModeFetchingStatus = new Map(_modeFetchingStatus)
        newModeFetchingStatus.delete(mode)
        return newModeFetchingStatus
      })
    })
  }

  const onWindDirectionLayerSelect = async () => {
    if (windDirectionData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.WIND_DIRECTION, true)
          return newLayerFetchingStatus
        })
        if (isFetchingWindDirectionData) return
        setIsFetchingWindDirectionData(true)
        const response = await axios.get<MOSDACWindDirectionData>('/api/mosdac-wind-direction')
        setIsFetchingWindDirectionData(false)
        setWindDirectionData(toWindVelocityFormat(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.WIND_DIRECTION)
          newLayerFetchingStatus.delete(Layer.WIND_HEATMAP)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const onWindHeatmapLayerSelect = async () => {
    if (windDirectionData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.WIND_HEATMAP, true)
          return newLayerFetchingStatus
        })
        if (isFetchingWindDirectionData) return
        setIsFetchingWindDirectionData(true)
        const response = await axios.get<MOSDACWindDirectionData>('/api/mosdac-wind-direction')
        setIsFetchingWindDirectionData(false)
        setWindDirectionData(toWindVelocityFormat(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.WIND_DIRECTION)
          newLayerFetchingStatus.delete(Layer.WIND_HEATMAP)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const onFireSmokeLayerSelect = async () => {
    if (fireSmokeData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.FIRE_SMOKE, true)
          return newLayerFetchingStatus
        })
        if (isFetchingFireSmokeData) return
        setIsFetchingFireSmokeData(true)
        const response = await axios.get<MOSDACFireSmoke>('/api/mosdac-fire-smoke')
        setIsFetchingFireSmokeData(false)
        setFireSmokeData(response.data.features.map((feature, index) => toFirePoint(index, feature)))
        setFireSmokeHeatmapData(
          response.data.features
            .map((feature, index) => toFirePoint(index, feature))
            .map(fireSmokeDatum => [fireSmokeDatum.lat, fireSmokeDatum.lng, 0.7])
        )
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.FIRE_SMOKE)
          newLayerFetchingStatus.delete(Layer.FIRE_SMOKE_HEATMAP)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const onFireSmokeHeatmapLayerSelect = async () => {
    if (fireSmokeHeatmapData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.FIRE_SMOKE_HEATMAP, true)
          return newLayerFetchingStatus
        })
        if (isFetchingFireSmokeData) return
        setIsFetchingFireSmokeData(true)
        const response = await axios.get<MOSDACFireSmoke>('/api/mosdac-fire-smoke')
        setIsFetchingFireSmokeData(false)
        setFireSmokeData(response.data.features.map((feature, index) => toFirePoint(index, feature)))
        setFireSmokeHeatmapData(
          response.data.features
            .map((feature, index) => toFirePoint(index, feature))
            .map(fireSmokeDatum => [fireSmokeDatum.lat, fireSmokeDatum.lng, 0.7])
        )
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.FIRE_SMOKE)
          newLayerFetchingStatus.delete(Layer.FIRE_SMOKE_HEATMAP)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  // Effects:
  useEffect(() => {
    getMOSDACLogData()
  }, [])

  // Return:
  return (
    <div className='relative w-screen h-screen bg-slate-400 overflow-hidden'>
      <div className='absolute left-3 top-3 z-[1001] flex justify-center items-center flex-col gap-2 w-42 p-3 bg-white rounded-md'>
        <LayersCombobox
          layers={layers}
          setLayers={setLayers}
          layerFetchingStatus={layerFetchingStatus}
          onWindDirectionLayerSelect={onWindDirectionLayerSelect}
          onWindHeatmapLayerSelect={onWindHeatmapLayerSelect}
          onFireSmokeLayerSelect={onFireSmokeLayerSelect}
          onFireSmokeHeatmapLayerSelect={onFireSmokeHeatmapLayerSelect}
        />
        <HistoryCombobox
          logs={logs}
          selectedLog={selectedLog}
          onSelect={onLogSelect}
          historicalLogsFetchingStatus={historicalLogsFetchingStatus}
        />
        <Button variant='outline' className='relative w-full cursor-pointer'>
          <div className={cn('absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all', isAnimationOn ? 'bg-green-500' : 'bg-rose-400')} />
          Animation
        </Button>
        <LegendsCombobox
          selectedMode={mode}
          onSelect={onModeSelect}
          modeFetchingStatus={modeFetchingStatus}
        />
        <div className='flex flex-col gap-2.5 w-full p-2 pb-2.5 border bg-secondary rounded-md'>
          <div className='flex items-center justify-between w-full'>
            <span className='text-xs font-semibold'>Opacity</span>
            <span className='text-xs font-medium'>{(opacity * 100).toFixed(0)}%</span>
          </div>
          <Slider
            defaultValue={[opacity * 100]}
            max={100}
            step={1}
            onValueChange={value => setOpacity(value[0] / 100)}
          />
        </div>
      </div>
      <LeafletMap
        images={images}
        mode={mode}
        opacity={opacity}
        selectedLog={selectedLog}
        layers={layers}
        windDirectionData={windDirectionData}
        fireSmokeData={fireSmokeData}
        fireSmokeHeatmapData={fireSmokeHeatmapData}
      />
      <Footer />
    </div>
  )
}

// Exports:
export default Leaflet
