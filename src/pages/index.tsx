// Packages:
import dynamic from 'next/dynamic'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import localforage from 'localforage'
import toFirePoint from '@/lib/toFirePoint'
import toWindVelocityFormat from '@/lib/toWindVelocityFormat'
import { toast } from 'sonner'
import processCloudburstHeavyRain from '@/lib/processCloudburstHeavyRain'

// Typescript:
import type { MOSDACWindDirectionData } from './api/wind-direction'
import type { MOSDACLogData, MOSDACLog } from './api/log'
import { MOSDACImageMode } from './api/history'
import type { MOSDACWindVelocity } from '@/lib/toWindVelocityFormat'
import type { MOSDACFireSmoke } from './api/fire-smoke'
import type { FirePoint } from '@/lib/toFirePoint'
import type { HeatLatLngTuple } from 'leaflet'
import type { MOSDACCloudburstAndHeavyRain } from './api/cloudburst-and-heavy-rain'
import type { CloudburstHeavyRainProcessedData } from '@/lib/processCloudburstHeavyRain'
import type { MOSDACSnowInfo } from './api/snow-info'

export enum LogDownloadStatus {
  DOWNLOADING = 0,
  DOWNLOADED = 1,
  FAILED_TO_DOWNLOAD = 2,
}

// Assets:
import { FrownIcon } from 'lucide-react'

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

export const ANIMATION_SPEEDS = [
  {
    id: '3mps',
    label: '3m/s',
    value: 50,
  },
  {
    id: '6mps',
    label: '6m/s',
    value: 100,
  },
  {
    id: '15mps',
    label: '15m/s',
    value: 250,
  },
  {
    id: '30mps',
    label: '30m/s',
    value: 500,
  },
  {
    id: '1hps',
    label: '1h/s',
    value: 1000,
  },
]

// Components:
import Footer from '@/components/Footer'
import LayersCombobox, { Layer } from '@/components/LayersCombobox'
import HistoryCombobox from '@/components/HistoryCombobox'
import LegendsCombobox from '@/components/ModesCombobox'
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })
import { Slider } from '@/components/ui/slider'
import AnimationCombobox from '@/components/AnimationCombobox'
import MOSDACDownDialog from '@/components/MOSDACDownDialog'
import SettingsDialog from '@/components/SettingsDialog'

// Functions:
const Leaflet = () => {
  // Ref:
  const activeNetworkRequestsRef = useRef(0)

  // State:
  const [isMOSDACDownDialogOpen, setIsMOSDACDownDialogOpen] = useState(false)
  const [layers, setLayers] = useState<Layer[]>([])
  const [windDirectionData, setWindDirectionData] = useState<MOSDACWindVelocity | null>(null)
  const [isFetchingWindDirectionData, setIsFetchingWindDirectionData] = useState(false)
  const [fireSmokeData, setFireSmokeData] = useState<FirePoint[] | null>(null)
  const [isFetchingFireSmokeData, setIsFetchingFireSmokeData] = useState(false)
  const [fireSmokeHeatmapData, setFireSmokeHeatmapData] = useState<HeatLatLngTuple[] | null>(null)
  const [isFetchingCloudburstHeavyRainData, setIsFetchingCloudburstHeavyRainData] = useState(false)
  const [cloudburstHeavyRainData, setCloudburstHeavyRainData] = useState<CloudburstHeavyRainProcessedData | null>(null)
  const [isFetchingRipCurrentForecastData, setIsFetchingRipCurrentForecastData] = useState(false)
  const [ripCurrentForecastData, setRipCurrentForecastData] = useState<string | null>(null)
  const [isFetchingSnowImages, setIsFetchingSnowImages] = useState(false)
  const [snowLayerFetchingStatus, setSnowLayerFetchingStatus] = useState<number | boolean>(0)
  const [snowInfo, setSnowInfo] = useState<MOSDACSnowInfo | null>(null)
  const [snowImages, setSnowImages] = useState<Map<string, string>>(new Map())
  const [layerFetchingStatus, setLayerFetchingStatus] = useState<Map<Layer, boolean>>(new Map())
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [isFetchingImages, setIsFetchingImages] = useState(false)
  const [historicalLogsFetchingStatus, setHistoricalLogsFetchingStatus] = useState<Map<string, number | boolean>>(new Map())
  const [logs, setLogs] = useState<MOSDACLogData>([])
  const [logDownloadStatus, setLogDownloadStatus] = useState<Map<string, LogDownloadStatus>>(new Map())
  const [numberOfLogsDownloaded, setNumberOfLogsDownloaded] = useState(0)
  const [averageLogDownloadSpeed, setAverageLogDownloadSpeed] = useState(0)
  const [selectedLog, setSelectedLog] = useState<MOSDACLog | null>(null)
  const [selectedLogIndex, setSelectedLogIndex] = useState(0)
  const [mode, setMode] = useState<MOSDACImageMode>(MOSDACImageMode.GREYSCALE)
  const [modeFetchingStatus, setModeFetchingStatus] = useState<Map<MOSDACImageMode, number | boolean>>(new Map())
  const [opacity, setOpacity] = useState(0.85)
  const [isAnimationOn, setIsAnimationOn] = useState(false)
  const [animationRangeIndices, setAnimationRangeIndices] = useState<[number, number]>([0, 0])
  const [selectedAnimationSpeed, setSelectedAnimationSpeed] = useState<typeof ANIMATION_SPEEDS[number]>(ANIMATION_SPEEDS[0])

  // Memo:
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs])

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
      const { data } = await axios.get('/api/log')
      if (Array.isArray(data)) {
        const sortedLogs = sortLogs(data)
        setLogs(sortedLogs)
        setSelectedLog(sortedLogs[0])
        setSelectedLogIndex(sortedLogs.length - 1)
        setAnimationRangeIndices([sortedLogs.length - 1 - 10, sortedLogs.length - 1])
        onLogSelect(sortedLogs[0], 0)
      }
      else throw new Error(data)
    } catch (error) {
      console.error(`Upstream is fucked`, error)
      setIsMOSDACDownDialogOpen(true)
    }
  }

  const getMOSDACImageURL = (box: Box, log: MOSDACLog, mode: MOSDACImageMode) => {
    return `/api/history?bbox=${box.bbox}&date=${log.when.date}&month=${log.when.month}&year=${log.when.year}&formattedTimestamp=${log.when.formatted}&mode=${mode}`
  }

  const fetchMOSDACImages = async (log: MOSDACLog, mode: MOSDACImageMode, forProperty: 'log' | 'mode' = 'log'): Promise<number | null> => {
    try {
      let fetchedImageCount = 0
      const existingImages = new Map(images)
      const requests: Array<Promise<{ key: string, url: string }>> = []
      let usedAnyCachedImage = false
      let networkDownloadStarted = false
      let networkDownloadStartTime = 0
      let wasContendedAtStart = false

      for (const boxRow of BOXES) {
        for (const box of boxRow) {
          const key = box.bbox + mode + log.when.formatted
          if (existingImages.has(key)) {
            usedAnyCachedImage = true
            continue
          }

          const imageURL = getMOSDACImageURL(box, log, mode)
          const request = new Promise<{ key: string, url: string }>(resolve => {
            localforage.getItem<Blob>(key).then(image => {
              if (image !== null) {
                usedAnyCachedImage = true
                resolve({ key, url: URL.createObjectURL(image) })
              }
              else {
                if (!networkDownloadStarted) {
                  networkDownloadStarted = true
                  wasContendedAtStart = activeNetworkRequestsRef.current > 0
                  networkDownloadStartTime = (typeof performance !== 'undefined' ? performance.now() : Date.now())
                }
                activeNetworkRequestsRef.current++
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
                  .finally(() => {
                    activeNetworkRequestsRef.current--
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

      if (usedAnyCachedImage || !networkDownloadStarted || wasContendedAtStart) return null

      const networkDownloadEndTime = (typeof performance !== 'undefined' ? performance.now() : Date.now())
      return Math.round(networkDownloadEndTime - networkDownloadStartTime)
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetchingImages(false)
    }
    return null
  }

  const onLogSelect = async (log: MOSDACLog, logIndex: number) => {
    let previousLog = selectedLog
    try {
      setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
        const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
        newHistoricalLogsFetchingStatus.set(log.name, 0)
        return newHistoricalLogsFetchingStatus
      })
      setSelectedLog(log)
      setSelectedLogIndex(logIndex)

      if (logs.length > 0) {
        if (logIndex > logs.length - 1 - animationRangeIndices[0]) {
          setAnimationRangeIndices(_animationRangeIndices => [(logs.length - 1 - logIndex), animationRangeIndices[1]])
        } else if (logIndex < logs.length - 1 - animationRangeIndices[1]) {
          setAnimationRangeIndices(_animationRangeIndices => [animationRangeIndices[0], (logs.length - 1 - logIndex)])
        }
      }

      setLogDownloadStatus(_logDownloadStatus => {
        const newLogDownloadStatus = new Map(_logDownloadStatus)
        newLogDownloadStatus.set(log.name, LogDownloadStatus.DOWNLOADING)
        return newLogDownloadStatus
      })
      const totalSpeed = (await fetchMOSDACImages(log, mode, 'log'))
      if (totalSpeed !== null) {
        setAverageLogDownloadSpeed(_averageLogDownloadSpeed => (
          ((_averageLogDownloadSpeed * numberOfLogsDownloaded) + totalSpeed) / (numberOfLogsDownloaded + 1)
        ))
        setNumberOfLogsDownloaded(_numberOfLogsDownloaded => _numberOfLogsDownloaded + 1)
      }
      setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
        const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
        newHistoricalLogsFetchingStatus.delete(log.name)
        return newHistoricalLogsFetchingStatus
      })
      setLogDownloadStatus(_logDownloadStatus => {
        const newLogDownloadStatus = new Map(_logDownloadStatus)
        newLogDownloadStatus.set(log.name, LogDownloadStatus.DOWNLOADED)
        return newLogDownloadStatus
      })
    } catch (error) {
      console.error(error)
      toast.error(
        'We\'re not able to load data for this log at the moment. Sorry!',
        {
          position: 'top-right',
          icon: <FrownIcon className='size-4' />,
          style: {
            width: 'max-content',
          }
        }
      )
      setSelectedLog(previousLog)
      setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
        const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
        newHistoricalLogsFetchingStatus.set(log.name, false)
        return newHistoricalLogsFetchingStatus
      })
      setLogDownloadStatus(_logDownloadStatus => {
        const newLogDownloadStatus = new Map(_logDownloadStatus)
        newLogDownloadStatus.set(log.name, LogDownloadStatus.FAILED_TO_DOWNLOAD)
        return newLogDownloadStatus
      })
    }
  }

  const onModeSelect = async (newMode: MOSDACImageMode) => {
    let previousMode = mode
    try {
      if (!selectedLog) return
      setModeFetchingStatus(_modeFetchingStatus => {
        const newModeFetchingStatus = new Map(_modeFetchingStatus)
        newModeFetchingStatus.set(newMode, 0)
        return newModeFetchingStatus
      })
      setMode(newMode)
      await fetchMOSDACImages(selectedLog, newMode, 'mode')
      setModeFetchingStatus(_modeFetchingStatus => {
        const newModeFetchingStatus = new Map(_modeFetchingStatus)
        newModeFetchingStatus.delete(newMode)
        return newModeFetchingStatus
      })
    } catch (error) {
      console.error(error)
      toast.error(
        'We\'re not able to load data for this mode at the moment. Sorry!',
        {
          position: 'top-right',
          icon: <FrownIcon className='size-4' />,
          style: {
            width: 'max-content',
          }
        }
      )
      setMode(previousMode)
      setModeFetchingStatus(_modeFetchingStatus => {
        const newModeFetchingStatus = new Map(_modeFetchingStatus)
        newModeFetchingStatus.set(newMode, false)
        return newModeFetchingStatus
      })
    }
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
        const response = await axios.get<MOSDACWindDirectionData>('/api/wind-direction')
        setWindDirectionData(toWindVelocityFormat(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.WIND_DIRECTION)
          newLayerFetchingStatus.delete(Layer.WIND_HEATMAP)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
        toast.error(
          'We\'re not able to load data for wind at the moment. Sorry!',
          {
            position: 'top-right',
            icon: <FrownIcon className='size-4' />,
            style: {
              width: 'max-content',
            }
          }
        )
        setLayers(_layers => _layers.filter(layerID => (layerID !== Layer.WIND_DIRECTION && layerID !== Layer.WIND_HEATMAP)))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          if (newLayerFetchingStatus.get(Layer.WIND_DIRECTION)) newLayerFetchingStatus.set(Layer.WIND_DIRECTION, false)
          if (newLayerFetchingStatus.get(Layer.WIND_HEATMAP)) newLayerFetchingStatus.set(Layer.WIND_HEATMAP, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingWindDirectionData(false)
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
        const response = await axios.get<MOSDACWindDirectionData>('/api/wind-direction')
        setWindDirectionData(toWindVelocityFormat(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.WIND_DIRECTION)
          newLayerFetchingStatus.delete(Layer.WIND_HEATMAP)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
        toast.error(
          'We\'re not able to load data for wind at the moment. Sorry!',
          {
            position: 'top-right',
            icon: <FrownIcon className='size-4' />,
            style: {
              width: 'max-content',
            }
          }
        )
        setLayers(_layers => _layers.filter(layerID => (layerID !== Layer.WIND_DIRECTION && layerID !== Layer.WIND_HEATMAP)))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          if (newLayerFetchingStatus.get(Layer.WIND_DIRECTION)) newLayerFetchingStatus.set(Layer.WIND_DIRECTION, false)
          if (newLayerFetchingStatus.get(Layer.WIND_HEATMAP)) newLayerFetchingStatus.set(Layer.WIND_HEATMAP, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingWindDirectionData(false)
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
        const response = await axios.get<MOSDACFireSmoke>('/api/fire-smoke')
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
        toast.error(
          'We\'re not able to load data for fire & smoke at the moment. Sorry!',
          {
            position: 'top-right',
            icon: <FrownIcon className='size-4' />,
            style: {
              width: 'max-content',
            }
          }
        )
        setLayers(_layers => _layers.filter(layerID => (layerID !== Layer.FIRE_SMOKE && layerID !== Layer.FIRE_SMOKE_HEATMAP)))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          if (newLayerFetchingStatus.get(Layer.FIRE_SMOKE)) newLayerFetchingStatus.set(Layer.FIRE_SMOKE, false)
          if (newLayerFetchingStatus.get(Layer.FIRE_SMOKE_HEATMAP)) newLayerFetchingStatus.set(Layer.FIRE_SMOKE_HEATMAP, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingFireSmokeData(false)
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
        const response = await axios.get<MOSDACFireSmoke>('/api/fire-smoke')
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
        toast.error(
          'We\'re not able to load data for fire & smoke at the moment. Sorry!',
          {
            position: 'top-right',
            icon: <FrownIcon className='size-4' />,
            style: {
              width: 'max-content',
            }
          }
        )
        setLayers(_layers => _layers.filter(layerID => (layerID !== Layer.FIRE_SMOKE && layerID !== Layer.FIRE_SMOKE_HEATMAP)))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          if (newLayerFetchingStatus.get(Layer.FIRE_SMOKE)) newLayerFetchingStatus.set(Layer.FIRE_SMOKE, false)
          if (newLayerFetchingStatus.get(Layer.FIRE_SMOKE_HEATMAP)) newLayerFetchingStatus.set(Layer.FIRE_SMOKE_HEATMAP, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingFireSmokeData(false)
      }
    }
  }

  const onHeavyRainLayerSelect = async () => {
    if (cloudburstHeavyRainData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.HEAVY_RAIN, true)
          return newLayerFetchingStatus
        })
        if (isFetchingCloudburstHeavyRainData) return
        setIsFetchingCloudburstHeavyRainData(true)
        const response = await axios.get<MOSDACCloudburstAndHeavyRain>('/api/cloudburst-and-heavy-rain')
        setCloudburstHeavyRainData(processCloudburstHeavyRain(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.HEAVY_RAIN)
          newLayerFetchingStatus.delete(Layer.HEAVY_RAIN_FORECAST)
          newLayerFetchingStatus.delete(Layer.CLOUDBURST_FORECAST)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
          toast.error(
            'We\'re not able to load data for cloudburst and heavy rain at the moment. Sorry!',
            {
              position: 'top-right',
              icon: <FrownIcon className='size-4' />,
              style: {
                width: 'max-content',
              }
            }
          )
        setLayers(_layers => _layers.filter(layerID => (
          layerID !== Layer.HEAVY_RAIN &&
          layerID !== Layer.HEAVY_RAIN_FORECAST &&
          layerID !== Layer.CLOUDBURST_FORECAST
        )))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          if (newLayerFetchingStatus.get(Layer.HEAVY_RAIN)) newLayerFetchingStatus.set(Layer.HEAVY_RAIN, false)
          if (newLayerFetchingStatus.get(Layer.HEAVY_RAIN_FORECAST)) newLayerFetchingStatus.set(Layer.HEAVY_RAIN_FORECAST, false)
          if (newLayerFetchingStatus.get(Layer.CLOUDBURST_FORECAST)) newLayerFetchingStatus.set(Layer.CLOUDBURST_FORECAST, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingCloudburstHeavyRainData(false)
      }
    }
  }

  const onHeavyRainForecastLayerSelect = async () => {
    if (cloudburstHeavyRainData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.HEAVY_RAIN_FORECAST, true)
          return newLayerFetchingStatus
        })
        if (isFetchingCloudburstHeavyRainData) return
        setIsFetchingCloudburstHeavyRainData(true)
        const response = await axios.get<MOSDACCloudburstAndHeavyRain>('/api/cloudburst-and-heavy-rain')
        setCloudburstHeavyRainData(processCloudburstHeavyRain(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.HEAVY_RAIN)
          newLayerFetchingStatus.delete(Layer.HEAVY_RAIN_FORECAST)
          newLayerFetchingStatus.delete(Layer.CLOUDBURST_FORECAST)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
          toast.error(
            'We\'re not able to load data for cloudburst and heavy rain at the moment. Sorry!',
            {
              position: 'top-right',
              icon: <FrownIcon className='size-4' />,
              style: {
                width: 'max-content',
              }
            }
          )
        setLayers(_layers => _layers.filter(layerID => (
          layerID !== Layer.HEAVY_RAIN &&
          layerID !== Layer.HEAVY_RAIN_FORECAST &&
          layerID !== Layer.CLOUDBURST_FORECAST
        )))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          if (newLayerFetchingStatus.get(Layer.HEAVY_RAIN)) newLayerFetchingStatus.set(Layer.HEAVY_RAIN, false)
          if (newLayerFetchingStatus.get(Layer.HEAVY_RAIN_FORECAST)) newLayerFetchingStatus.set(Layer.HEAVY_RAIN_FORECAST, false)
          if (newLayerFetchingStatus.get(Layer.CLOUDBURST_FORECAST)) newLayerFetchingStatus.set(Layer.CLOUDBURST_FORECAST, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingCloudburstHeavyRainData(false)
      }
    }
  }

  const onCloudburstForecastLayerSelect = async () => {
    if (cloudburstHeavyRainData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.CLOUDBURST_FORECAST, true)
          return newLayerFetchingStatus
        })
        if (isFetchingCloudburstHeavyRainData) return
        setIsFetchingCloudburstHeavyRainData(true)
        const response = await axios.get<MOSDACCloudburstAndHeavyRain>('/api/cloudburst-and-heavy-rain')
        setCloudburstHeavyRainData(processCloudburstHeavyRain(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.HEAVY_RAIN)
          newLayerFetchingStatus.delete(Layer.HEAVY_RAIN_FORECAST)
          newLayerFetchingStatus.delete(Layer.CLOUDBURST_FORECAST)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
          toast.error(
            'We\'re not able to load data for cloudburst and heavy rain at the moment. Sorry!',
            {
              position: 'top-right',
              icon: <FrownIcon className='size-4' />,
              style: {
                width: 'max-content',
              }
            }
          )
        setLayers(_layers => _layers.filter(layerID => (
          layerID !== Layer.HEAVY_RAIN &&
          layerID !== Layer.HEAVY_RAIN_FORECAST &&
          layerID !== Layer.CLOUDBURST_FORECAST
        )))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          if (newLayerFetchingStatus.get(Layer.HEAVY_RAIN)) newLayerFetchingStatus.set(Layer.HEAVY_RAIN, false)
          if (newLayerFetchingStatus.get(Layer.HEAVY_RAIN_FORECAST)) newLayerFetchingStatus.set(Layer.HEAVY_RAIN_FORECAST, false)
          if (newLayerFetchingStatus.get(Layer.CLOUDBURST_FORECAST)) newLayerFetchingStatus.set(Layer.CLOUDBURST_FORECAST, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingCloudburstHeavyRainData(false)
      }
    }
  }

  const onRipCurrentForecastLayerSelect = async () => {
    if (ripCurrentForecastData === null) {
      try {
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.RIP_CURRENT_FORECAST, true)
          return newLayerFetchingStatus
        })
        if (isFetchingRipCurrentForecastData) return
        setIsFetchingRipCurrentForecastData(true)
        const now = new Date()
        const currentDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${(now.getDate()).toString().padStart(2, '0')}`
        const currentLocalHour = (now.getHours()).toString().padStart(2, '0')
        const response = await axios.get<Blob>(`/api/rip-current-forecast?date=${currentDate}&hour=${currentLocalHour}`, { responseType: 'blob' })
        setRipCurrentForecastData(URL.createObjectURL(response.data))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.delete(Layer.RIP_CURRENT_FORECAST)
          return newLayerFetchingStatus
        })
      } catch (error) {
        console.error(error)
          toast.error(
            'We\'re not able to load data for rip current forecast at the moment. Sorry!',
            {
              position: 'top-right',
              icon: <FrownIcon className='size-4' />,
              style: {
                width: 'max-content',
              }
            }
          )
        setLayers(_layers => _layers.filter(layerID => layerID !== Layer.RIP_CURRENT_FORECAST))
        setLayerFetchingStatus(_layerFetchingStatus => {
          const newLayerFetchingStatus = new Map(_layerFetchingStatus)
          newLayerFetchingStatus.set(Layer.RIP_CURRENT_FORECAST, false)
          return newLayerFetchingStatus
        })
      } finally {
        setIsFetchingRipCurrentForecastData(false)
      }
    }
  }

  const getMOSDACSnowImageURL = (box: Box, _snowInfo: MOSDACSnowInfo) => {
    return `/api/snow?bbox=${box.bbox}&time=${_snowInfo.time}&date=${_snowInfo.date}&month=${_snowInfo.month}&year=${_snowInfo.year}`
  }

  const fetchMOSDACSnowImages = async (_snowInfo: MOSDACSnowInfo) => {
    let fetchedSnowImageCount = 0
    const existingImages = new Map(snowImages)
    const requests: Array<Promise<{ key: string, url: string }>> = []
    let failedRequestCount = 0

    for (const boxRow of BOXES) {
      for (const box of boxRow) {
        const key = box.bbox + mode + _snowInfo.time + _snowInfo.date + _snowInfo.month + _snowInfo.year + 'SNOW'
        if (existingImages.has(key)) continue

        const snowImageURL = getMOSDACSnowImageURL(box, _snowInfo)
        const request = new Promise<{ key: string, url: string }>((resolve, reject) => {
          localforage.getItem<Blob>(key).then(snowImage => {
            if (snowImage !== null) resolve({ key, url: URL.createObjectURL(snowImage) })
            else {
              axios
                .get<Blob>(snowImageURL, { responseType: 'blob' })
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
                .catch(() => {
                  failedRequestCount++
                  reject()
                })
            }
          })
        })
        requests.push(request)
      }
    }

    if (requests.length > 0) setIsFetchingSnowImages(true)

    for (const request of requests) {
      request
        .then(({ key, url }) => {
          setSnowLayerFetchingStatus(++fetchedSnowImageCount/requests.length)
          setSnowImages(prev => {
            const next = new Map(prev)
            next.set(key, url)
            return next
          })
        })
        .catch(() => {})
    }

    await Promise.allSettled(requests)

    if (failedRequestCount > 0 && requests.length > 0) {
      throw new Error('Failed to fetch snow cover images!')
    }
  }

  const onSnowLayerSelect = async () => {
    if (snowImages.size > 0 || isFetchingSnowImages) return

    try {
      setLayerFetchingStatus(_layerFetchingStatus => {
        const newLayerFetchingStatus = new Map(_layerFetchingStatus)
        newLayerFetchingStatus.set(Layer.SNOW, true)
        return newLayerFetchingStatus
      })

      setSnowLayerFetchingStatus(0)
      let _snowInfo: null | MOSDACSnowInfo = null
      if (snowInfo === null) {
        const response = await axios.get<MOSDACSnowInfo>('/api/snow-info')
        setSnowInfo(response.data)
        _snowInfo = response.data
      } else {
        _snowInfo = snowInfo
      }
      
      await fetchMOSDACSnowImages(_snowInfo)
      setLayerFetchingStatus(_layerFetchingStatus => {
        const newLayerFetchingStatus = new Map(_layerFetchingStatus)
        newLayerFetchingStatus.delete(Layer.SNOW)
        return newLayerFetchingStatus
      })
      setSnowLayerFetchingStatus(0)
    } catch (error) {
      console.error(error)
      toast.error(
        'We\'re not able to load data for snow cover at the moment. Sorry!',
        {
          position: 'top-right',
          icon: <FrownIcon className='size-4' />,
          style: {
            width: 'max-content',
          }
        }
      )
      setLayers(_layers => _layers.filter(layerID => layerID !== Layer.SNOW))
      setLayerFetchingStatus(_layerFetchingStatus => {
        const newLayerFetchingStatus = new Map(_layerFetchingStatus)
        newLayerFetchingStatus.set(Layer.SNOW, false)
        return newLayerFetchingStatus
      })
    } finally {
      setIsFetchingSnowImages(false)
    }
  }

  // Effects:
  useEffect(() => {
    localforage.config({
      driver: localforage.INDEXEDDB,
      name: 'bosdac',
      storeName: 'bosdac-cache'
    })

    // getMOSDACLogData()
  }, [])
  
  // Return:
  return (
    <>
      <div className='relative w-screen h-screen bg-slate-400 overflow-hidden'>
        <div className='absolute left-3 top-3 z-[1001] flex justify-center items-center flex-col gap-2 w-48 p-3 bg-white rounded-md'>
          <LayersCombobox
            layers={layers}
            setLayers={setLayers}
            layerFetchingStatus={layerFetchingStatus}
            onWindDirectionLayerSelect={onWindDirectionLayerSelect}
            onWindHeatmapLayerSelect={onWindHeatmapLayerSelect}
            onFireSmokeLayerSelect={onFireSmokeLayerSelect}
            onFireSmokeHeatmapLayerSelect={onFireSmokeHeatmapLayerSelect}
            onHeavyRainLayerSelect={onHeavyRainLayerSelect}
            onHeavyRainForecastLayerSelect={onHeavyRainForecastLayerSelect}
            onCloudburstForecastLayerSelect={onCloudburstForecastLayerSelect}
            onRipCurrentForecastLayerSelect={onRipCurrentForecastLayerSelect}
            onSnowLayerSelect={onSnowLayerSelect}
          />
          <HistoryCombobox
            logs={logs}
            selectedLog={selectedLog}
            onSelect={onLogSelect}
            historicalLogsFetchingStatus={historicalLogsFetchingStatus}
          />
          <AnimationCombobox
            logs={reversedLogs}
            logDownloadStatus={logDownloadStatus}
            averageLogDownloadSpeed={averageLogDownloadSpeed}
            isAnimationOn={isAnimationOn}
            setIsAnimationOn={setIsAnimationOn}
            selectedLogIndex={logs.length - 1 - selectedLogIndex}
            onLogSelect={onLogSelect}
            animationRangeIndices={animationRangeIndices}
            setAnimationRangeIndices={setAnimationRangeIndices}
            selectedAnimationSpeed={selectedAnimationSpeed}
            setSelectedAnimationSpeed={setSelectedAnimationSpeed}
          />
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
          <SettingsDialog />
          <div
            className='flex items-center justify-center w-full h-8 p-2 text-xs text-muted-foreground bg-accent rounded-md overflow-hidden transition-all'
          >
            Made by diragb
          </div>
          <div className='relative flex items-center justify-center gap-1 w-full h-8 rounded-md overflow-hidden'>
            <div
              className='group flex items-center justify-center w-1/2 h-full ml-0.5 bg-black rounded-md cursor-pointer transition-all hover:bg-blue-500'
              onClick={() => {
                window.open('https://github.com/diragb', '_blank')
              }}
            >
              <div
                className='size-3.5 bg-cover bg-center bg-no-repeat invert-100 transition-all'
                style={{  
                  backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg)',
                }}
              />
            </div>
            <div
              className='group flex items-center justify-center w-1/2 h-full mr-0.5 bg-black rounded-md cursor-pointer transition-all hover:bg-blue-500'
              onClick={() => {
                window.open('https://x.com/intent/user?screen_name=diragb', '_blank')
              }}
            >
              <div
                className='size-3.5 bg-cover bg-center bg-no-repeat transition-all'
                style={{  
                  backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png)',
                }}
              />
            </div>
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
          cloudburstHeavyRainData={cloudburstHeavyRainData}
          ripCurrentForecastData={ripCurrentForecastData}
          snowInfo={snowInfo}
          snowImages={snowImages}
        />
        <Footer />
      </div>
      <MOSDACDownDialog isOpen={isMOSDACDownDialogOpen} onOpenChange={setIsMOSDACDownDialogOpen} />
    </>
  )
}

// Exports:
export default Leaflet
