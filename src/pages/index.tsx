// Packages:
import dynamic from 'next/dynamic'
import { Geist } from 'next/font/google'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { toast } from 'sonner'
import localforage from 'localforage'
import sleep from 'sleep-promise'
import toFirePoint from '@/lib/toFirePoint'
import toWindVelocityFormat from '@/lib/toWindVelocityFormat'
import processCloudburstHeavyRain from '@/lib/processCloudburstHeavyRain'

// Typescript:
import type { Box } from '@/lib/box'
import { Layer } from '@/components/LayersCombobox'
import type { MOSDACLog, MOSDACLogData } from './api/log'
import { MOSDACImageMode } from './api/history'
import type { MOSDACWindVelocity } from '@/lib/toWindVelocityFormat'
import type { FirePoint } from '@/lib/toFirePoint'
import type { HeatLatLngTuple } from 'leaflet'
import type { CloudburstHeavyRainProcessedData } from '@/lib/processCloudburstHeavyRain'
import type { MOSDACSnowInfo } from './api/snow-info'
import { LogDownloadStatus } from '@/components/SidePanel'
import type { MOSDACFireSmoke } from '../pages/api/fire-smoke'
import type { MOSDACCloudburstAndHeavyRain } from '../pages/api/cloudburst-and-heavy-rain'
import type { MOSDACWindDirectionData } from '../pages/api/wind-direction'

// Assets:
import { FrownIcon, LogsIcon } from 'lucide-react'

// Constants:
import { BOXES } from '@/lib/box'
import { ANIMATION_SPEEDS } from '@/components/SidePanel'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

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
const LONG_PRESS_DELAY = 500

// Components:
import Footer from '@/components/Footer'
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })
import MOSDACDownDialog from '@/components/MOSDACDownDialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import SidePanel from '@/components/SidePanel'
import { Button } from '@/components/ui/button'

// Functions:
const Leaflet = () => {
  // Ref:
  const activeNetworkRequestsRef = useRef(0)
  const isLongPressingRef = useRef<'forward' | 'backward' | null>(null)
  const repeatRef = useRef(false)
  
  // State:
  const [useSmallView, setUseSmallView] = useState(false)
  const [isSmallViewDialogVisible, setIsShowSmallViewDialogVisible] = useState(false)
  const [isSmallViewDialogRendering, setIsShowSmallViewDialogRendering] = useState(false)
  const [isSidePanelPopoverOpen, setIsSidePanelPopoverOpen] = useState(false)
  const [isMOSDACDownDialogOpen, setIsMOSDACDownDialogOpen] = useState(false)
  const [historicalLogsFetchingStatus, setHistoricalLogsFetchingStatus] = useState<Map<string, number | boolean>>(new Map())
  const [isHistoryOn, setIsHistoryOn] = useState(false)
  const [logs, setLogs] = useState<MOSDACLogData>([])
  const [logDownloadStatus, setLogDownloadStatus] = useState<Map<string, LogDownloadStatus>>(new Map())
  const [numberOfLogsDownloaded, setNumberOfLogsDownloaded] = useState(0)
  const [averageLogDownloadSpeed, setAverageLogDownloadSpeed] = useState(0)
  const [, setIsFetchingImages] = useState(false)
  const [modeFetchingStatus, setModeFetchingStatus] = useState<Map<MOSDACImageMode, number | boolean>>(new Map())
  const [selectedLogIndex, setSelectedLogIndex] = useState(0)
  const [animationRangeIndices, setAnimationRangeIndices] = useState<[number, number]>([0, 0])
  const [layers, setLayers] = useState<Layer[]>([])
  const [windDirectionData, setWindDirectionData] = useState<MOSDACWindVelocity | null>(null)
  const [fireSmokeData, setFireSmokeData] = useState<FirePoint[] | null>(null)
  const [fireSmokeHeatmapData, setFireSmokeHeatmapData] = useState<HeatLatLngTuple[] | null>(null)
  const [cloudburstHeavyRainData, setCloudburstHeavyRainData] = useState<CloudburstHeavyRainProcessedData | null>(null)
  const [ripCurrentForecastData, setRipCurrentForecastData] = useState<string | null>(null)
  const [snowInfo, setSnowInfo] = useState<MOSDACSnowInfo | null>(null)
  const [snowImages, setSnowImages] = useState<Map<string, string>>(new Map())
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [selectedLog, setSelectedLog] = useState<MOSDACLog | null>(null)
  const [mode, setMode] = useState<MOSDACImageMode>(MOSDACImageMode.GREYSCALE)
  const [opacity, setOpacity] = useState(0.85)
  const [isFetchingWindDirectionData, setIsFetchingWindDirectionData] = useState(false)
  const [isFetchingFireSmokeData, setIsFetchingFireSmokeData] = useState(false)
  const [isFetchingCloudburstHeavyRainData, setIsFetchingCloudburstHeavyRainData] = useState(false)
  const [isFetchingRipCurrentForecastData, setIsFetchingRipCurrentForecastData] = useState(false)
  const [isFetchingSnowImages, setIsFetchingSnowImages] = useState(false)
  const [, setSnowLayerFetchingStatus] = useState<number | boolean>(0)
  const [layerFetchingStatus, setLayerFetchingStatus] = useState<Map<Layer, boolean>>(new Map())
  const [isAnimationOn, setIsAnimationOn] = useState(false)
  const [selectedAnimationSpeed, setSelectedAnimationSpeed] = useState<typeof ANIMATION_SPEEDS[number]>(ANIMATION_SPEEDS[0])
  const [isLongPressing, setIsLongPressing] = useState<'forward' | 'backward' | null>(null)
  const [repeat, setRepeat] = useState(false)

  // Ref:
  const animationRangeIndicesRef = useRef(animationRangeIndices)
  const isAnimationOnRef = useRef(isAnimationOn)

  // Memo:
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs])

  // Functions:
  const toggleSmallViewDialog = async (state: boolean) => {
    if (state) {
      setIsShowSmallViewDialogRendering(true)
      await sleep(0)
      setIsShowSmallViewDialogVisible(true)
    } else {
      setIsShowSmallViewDialogVisible(false)
      await sleep(150)
      setIsShowSmallViewDialogRendering(false)
    }
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

  const sortLogs = (logs: MOSDACLogData) => {
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
    const previousLog = selectedLog
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
          setAnimationRangeIndices(_animationRangeIndices => [(logs.length - 1 - logIndex), _animationRangeIndices[1]])
        } else if (logIndex < logs.length - 1 - animationRangeIndices[1]) {
          setAnimationRangeIndices(_animationRangeIndices => [_animationRangeIndices[0], (logs.length - 1 - logIndex)])
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
    const previousMode = mode
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

  const moveOneFrameBackward = (_selectedReversedLogIndex: number, allowRepeat?: boolean) => {
    if (isAnimationOn) return
    const newIndex = _selectedReversedLogIndex - 1
    if (newIndex >= animationRangeIndices[0] && newIndex <= animationRangeIndices[1]) {
      onLogSelect(reversedLogs[newIndex], reversedLogs.length - 1 - newIndex)
    } else if (newIndex < animationRangeIndices[0] && allowRepeat) {
      onLogSelect(reversedLogs[animationRangeIndices[1]], reversedLogs.length - 1 - animationRangeIndices[1])
    }
  }

  const moveOneFrameForward = (_selectedReversedLogIndex: number, allowRepeat?: boolean) => {
    if (isAnimationOn) return
    const newIndex = _selectedReversedLogIndex + 1
    if (newIndex >= animationRangeIndices[0] && newIndex <= animationRangeIndices[1]) {
      onLogSelect(reversedLogs[newIndex], reversedLogs.length - 1 - newIndex)
    } else if (newIndex > animationRangeIndices[1] && allowRepeat) {
      onLogSelect(reversedLogs[animationRangeIndices[0]], reversedLogs.length - 1 - animationRangeIndices[0])
    }
  }

  const startLongPress = async (direction: 'forward' | 'backward', _selectedReversedLogIndex: number) => {
    if (isAnimationOn) return
    
    isLongPressingRef.current = direction
    if (direction === 'forward') {
      moveOneFrameForward(_selectedReversedLogIndex, repeatRef.current)
    } else {
      moveOneFrameBackward(_selectedReversedLogIndex, repeatRef.current)
    }

    await sleep(LONG_PRESS_DELAY)
    
    if (isLongPressingRef.current === null || isLongPressingRef.current !== direction) {
      let nextSelectedReversedLogIndex = direction === 'forward' ?
        (_selectedReversedLogIndex + 1 <= animationRangeIndices[1] ? _selectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]) :
        (_selectedReversedLogIndex - 1 >= animationRangeIndices[0] ? _selectedReversedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0])
      
      setIsHistoryOn(nextSelectedReversedLogIndex !== animationRangeIndices[1])
      return
    }

    setIsLongPressing(direction)
    let nextSelectedReversedLogIndex = direction === 'forward' ?
      (_selectedReversedLogIndex + 1 <= animationRangeIndices[1] ? _selectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]) :
      (_selectedReversedLogIndex - 1 >= animationRangeIndices[0] ? _selectedReversedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0])

    while (true) {
      await sleep(selectedAnimationSpeed.value)
      if (isLongPressingRef.current === null || isLongPressingRef.current !== direction) break

      if (direction === 'forward') {
        moveOneFrameForward(nextSelectedReversedLogIndex)
        nextSelectedReversedLogIndex = nextSelectedReversedLogIndex + 1 <= animationRangeIndices[1] ? nextSelectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
      } else {
        moveOneFrameBackward(nextSelectedReversedLogIndex)
        nextSelectedReversedLogIndex = nextSelectedReversedLogIndex - 1 >= animationRangeIndices[0] ? nextSelectedReversedLogIndex - 1 : repeatRef.current ? animationRangeIndices[1] : animationRangeIndices[0]
      }
    }
  }

  const stopLongPress = useCallback(() => {
    isLongPressingRef.current = null
    setIsLongPressing(null)
  }, [])

  const play = async () => {
    if (isAnimationOnRef.current) return

    setIsAnimationOn(true)
    isAnimationOnRef.current = true

    const selectedReversedLogIndex = reversedLogs.length - 1 - selectedLogIndex
    let nextSelectedReversedLogIndex = selectedReversedLogIndex + 1 <= animationRangeIndices[1] ? selectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
    
    while (isAnimationOnRef.current) {
      await sleep(selectedAnimationSpeed.value)
      if (!isAnimationOnRef.current) break
      
      const previousSelectedLogIndex = nextSelectedReversedLogIndex
      onLogSelect(reversedLogs[nextSelectedReversedLogIndex], reversedLogs.length - 1 - nextSelectedReversedLogIndex)
      nextSelectedReversedLogIndex = nextSelectedReversedLogIndex = nextSelectedReversedLogIndex + 1 <= animationRangeIndices[1] ? nextSelectedReversedLogIndex + 1 : repeatRef.current ? animationRangeIndices[0] : animationRangeIndices[1]
      
      if (previousSelectedLogIndex === animationRangeIndices[1] && nextSelectedReversedLogIndex === animationRangeIndices[1]) {
        setIsAnimationOn(false)
        isAnimationOnRef.current = false
        break
      }
    }
  }

  const pause = () => {
    setIsAnimationOn(false)
    const selectedReversedLogIndex = reversedLogs.length - 1 - selectedLogIndex
    setIsHistoryOn(selectedReversedLogIndex !== animationRangeIndices[1])
  }

  const stop = () => {
    setIsAnimationOn(false)
    onLogSelect(reversedLogs[animationRangeIndices[1]], reversedLogs.length - 1 - animationRangeIndices[1])
  }

  // Effects:
  useEffect(() => {
    localforage.config({
      driver: localforage.INDEXEDDB,
      name: 'bosdac',
      storeName: 'bosdac-cache'
    })

    getMOSDACLogData()

    const handleResize = () => {
      const isSmall = window.innerWidth < 820
      setUseSmallView(prev => {
        if (prev !== isSmall) {
          return isSmall
        }
        return prev
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      stopLongPress()
    }
  }, [stopLongPress])

  useEffect(() => {
    animationRangeIndicesRef.current = animationRangeIndices
  }, [animationRangeIndices])

  useEffect(() => {
    isAnimationOnRef.current = isAnimationOn
  }, [isAnimationOn])

  // Return:
  return (
    <>
      <div className='relative w-screen h-screen bg-slate-400 overflow-hidden'>
        {
          useSmallView ? (
            <Popover open={isSidePanelPopoverOpen} onOpenChange={setIsSidePanelPopoverOpen}>
              <PopoverTrigger asChild>
                <Button size='icon' className={cn('absolute left-3 top-3 z-[1001] cursor-pointer transition-all', isSidePanelPopoverOpen && 'text-blue-400')}>
                  <LogsIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn('z-[1001] w-48 p-0', `${geistSans.className} font-sans`)} align='start' side='left' sideOffset={16}>
                {
                  isSmallViewDialogRendering && (
                    <div
                      className={cn(
                        'absolute -left-16 -top-3 z-[1002] w-screen h-screen bg-black/75 transition-all',
                        isSmallViewDialogVisible ? 'opacity-100' : 'opacity-0',
                      )}
                      onClick={() => toggleSmallViewDialog(false)}
                    />
                  )
                }
                <SidePanel
                  useSmallView={useSmallView}
                  toggleSmallViewDialog={toggleSmallViewDialog}
                  layers={layers}
                  setLayers={setLayers}
                  selectedLog={selectedLog}
                  mode={mode}
                  opacity={opacity}
                  setOpacity={setOpacity}
                  modeFetchingStatus={modeFetchingStatus}
                  logs={logs}
                  reversedLogs={reversedLogs}
                  onLogSelect={onLogSelect}
                  historicalLogsFetchingStatus={historicalLogsFetchingStatus}
                  isHistoryOn={isHistoryOn}
                  setIsHistoryOn={setIsHistoryOn}
                  logDownloadStatus={logDownloadStatus}
                  averageLogDownloadSpeed={averageLogDownloadSpeed}
                  selectedLogIndex={selectedLogIndex}
                  animationRangeIndices={animationRangeIndices}
                  setAnimationRangeIndices={setAnimationRangeIndices}
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
                  isAnimationOn={isAnimationOn}
                  setIsAnimationOn={setIsAnimationOn}
                  selectedAnimationSpeed={selectedAnimationSpeed}
                  setSelectedAnimationSpeed={setSelectedAnimationSpeed}
                  onModeSelect={onModeSelect}
                  repeat={repeat}
                  setRepeat={setRepeat}
                  repeatRef={repeatRef}
                  startLongPress={startLongPress}
                  stopLongPress={stopLongPress}
                  isLongPressing={isLongPressing}
                  pause={pause}
                  play={play}
                  stop={stop}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <SidePanel
              useSmallView={useSmallView}
              toggleSmallViewDialog={toggleSmallViewDialog}
              layers={layers}
              setLayers={setLayers}
              selectedLog={selectedLog}
              mode={mode}
              opacity={opacity}
              setOpacity={setOpacity}
              modeFetchingStatus={modeFetchingStatus}
              logs={logs}
              reversedLogs={reversedLogs}
              onLogSelect={onLogSelect}
              historicalLogsFetchingStatus={historicalLogsFetchingStatus}
              isHistoryOn={isHistoryOn}
              setIsHistoryOn={setIsHistoryOn}
              logDownloadStatus={logDownloadStatus}
              averageLogDownloadSpeed={averageLogDownloadSpeed}
              selectedLogIndex={selectedLogIndex}
              animationRangeIndices={animationRangeIndices}
              setAnimationRangeIndices={setAnimationRangeIndices}
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
              isAnimationOn={isAnimationOn}
              setIsAnimationOn={setIsAnimationOn}
              selectedAnimationSpeed={selectedAnimationSpeed}
              setSelectedAnimationSpeed={setSelectedAnimationSpeed}
              onModeSelect={onModeSelect}
              repeat={repeat}
              setRepeat={setRepeat}
              repeatRef={repeatRef}
              startLongPress={startLongPress}
              stopLongPress={stopLongPress}
              isLongPressing={isLongPressing}
              pause={pause}
              play={play}
              stop={stop}
            />
          )
        }
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
