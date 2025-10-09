// Packages:
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import toFirePoint from '@/lib/toFirePoint'
import toWindVelocityFormat from '@/lib/toWindVelocityFormat'
import processCloudburstHeavyRain from '@/lib/processCloudburstHeavyRain'
import localforage from 'localforage'

// Typescript:
import type { Box } from '@/lib/box'
import { Layer } from '@/components/LayersCombobox'
import type { MOSDACWindVelocity } from '@/lib/toWindVelocityFormat'
import type { FirePoint } from '@/lib/toFirePoint'
import type { HeatLatLngTuple } from 'leaflet'
import type { CloudburstHeavyRainProcessedData } from '@/lib/processCloudburstHeavyRain'
import type { MOSDACSnowInfo } from '../pages/api/snow-info'
import type { MOSDACFireSmoke } from '../pages/api/fire-smoke'
import type { MOSDACCloudburstAndHeavyRain } from '../pages/api/cloudburst-and-heavy-rain'
import type { MOSDACWindDirectionData } from '../pages/api/wind-direction'

interface ILayersContext {
  layerFetchingStatus: Map<Layer, boolean>
  windDirectionData: MOSDACWindVelocity | null
  fireSmokeData: FirePoint[] | null
  fireSmokeHeatmapData: HeatLatLngTuple[] | null
  cloudburstHeavyRainData: CloudburstHeavyRainProcessedData | null
  ripCurrentForecastData: string | null
  snowInfo: MOSDACSnowInfo | null
  snowImages: Map<string, string>
  onWindDirectionLayerSelect: () => void
  onWindHeatmapLayerSelect: () => void
  onFireSmokeLayerSelect: () => void
  onFireSmokeHeatmapLayerSelect: () => void
  onHeavyRainLayerSelect: () => void
  onHeavyRainForecastLayerSelect: () => void
  onCloudburstForecastLayerSelect: () => void
  onRipCurrentForecastLayerSelect: () => void
  onSnowLayerSelect: () => void
}

// Assets:
import { FrownIcon } from 'lucide-react'

// Constants:
import { BOXES } from '@/lib/box'

const LayersContext = createContext<ILayersContext>({
  layerFetchingStatus: new Map(),
  windDirectionData: null,
  fireSmokeData: null,
  fireSmokeHeatmapData: null,
  cloudburstHeavyRainData: null,
  ripCurrentForecastData: null,
  snowInfo: null,
  snowImages: new Map(),
  onWindDirectionLayerSelect: () => {},
  onWindHeatmapLayerSelect: () => {},
  onFireSmokeLayerSelect: () => {},
  onFireSmokeHeatmapLayerSelect: () => {},
  onHeavyRainLayerSelect: () => {},
  onHeavyRainForecastLayerSelect: () => {},
  onCloudburstForecastLayerSelect: () => {},
  onRipCurrentForecastLayerSelect: () => {},
  onSnowLayerSelect: () => {},
})

// Context:
import MapContext from './MapContext'

// Functions:
export const LayersContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const {
    setLayers,
    mode,
  } = useContext(MapContext)
  
  // State:
  const [windDirectionData, setWindDirectionData] = useState<MOSDACWindVelocity | null>(null)
  const [fireSmokeData, setFireSmokeData] = useState<FirePoint[] | null>(null)
  const [fireSmokeHeatmapData, setFireSmokeHeatmapData] = useState<HeatLatLngTuple[] | null>(null)
  const [cloudburstHeavyRainData, setCloudburstHeavyRainData] = useState<CloudburstHeavyRainProcessedData | null>(null)
  const [ripCurrentForecastData, setRipCurrentForecastData] = useState<string | null>(null)
  const [snowInfo, setSnowInfo] = useState<MOSDACSnowInfo | null>(null)
  const [snowImages, setSnowImages] = useState<Map<string, string>>(new Map())
  const [isFetchingWindDirectionData, setIsFetchingWindDirectionData] = useState(false)
  const [isFetchingFireSmokeData, setIsFetchingFireSmokeData] = useState(false)
  const [isFetchingCloudburstHeavyRainData, setIsFetchingCloudburstHeavyRainData] = useState(false)
  const [isFetchingRipCurrentForecastData, setIsFetchingRipCurrentForecastData] = useState(false)
  const [isFetchingSnowImages, setIsFetchingSnowImages] = useState(false)
  const [, setSnowLayerFetchingStatus] = useState<number | boolean>(0)
  const [layerFetchingStatus, setLayerFetchingStatus] = useState<Map<Layer, boolean>>(new Map())
  
  // Functions:
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

  const getMOSDACSnowImageURL = useCallback((box: Box, _snowInfo: MOSDACSnowInfo) => {
    return `/api/snow?bbox=${box.bbox}&time=${_snowInfo.time}&date=${_snowInfo.date}&month=${_snowInfo.month}&year=${_snowInfo.year}`
  }, [])

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

  // Return:
  return (
    <LayersContext.Provider
      value={useMemo(() => ({
        layerFetchingStatus,
        windDirectionData,
        fireSmokeData,
        fireSmokeHeatmapData,
        cloudburstHeavyRainData,
        ripCurrentForecastData,
        snowInfo,
        snowImages,
        onWindDirectionLayerSelect,
        onWindHeatmapLayerSelect,
        onFireSmokeLayerSelect,
        onFireSmokeHeatmapLayerSelect,
        onHeavyRainLayerSelect,
        onHeavyRainForecastLayerSelect,
        onCloudburstForecastLayerSelect,
        onRipCurrentForecastLayerSelect,
        onSnowLayerSelect,
      }), [
        layerFetchingStatus,
        windDirectionData,
        fireSmokeData,
        fireSmokeHeatmapData,
        cloudburstHeavyRainData,
        ripCurrentForecastData,
        snowInfo,
        snowImages,
      ])}
    >
      {children}
    </LayersContext.Provider>
  )
}

// Exports:
export default LayersContext
