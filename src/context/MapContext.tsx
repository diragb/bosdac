// Packages:
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import useLogs from '@/hooks/useLogs'
import localforage from 'localforage'
import axios from 'axios'
import { toast } from 'sonner'

// Typescript:
import type { Layer } from '@/components/LayersCombobox'
import type { MOSDACLog } from '@/pages/api/log'
import { MOSDACImageMode } from '@/pages/api/history'
import type { Box } from '@/lib/box'
import { LogDownloadStatus } from '@/components/SidePanel'

interface IMapContext {
  isHistoryOn: boolean
  setIsHistoryOn: React.Dispatch<React.SetStateAction<boolean>>
  logs: MOSDACLog[]
  reversedLogs: MOSDACLog[]
  historicalLogsFetchingStatus: Map<string, number | boolean>
  logDownloadStatus: Map<string, LogDownloadStatus>
  numberOfLogsDownloaded: number
  averageLogDownloadSpeed: number
  isFetchingImages: boolean
  images: Map<string, string>
  setImages: React.Dispatch<React.SetStateAction<Map<string, string>>>
  layers: Layer[]
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>
  selectedLog: MOSDACLog | null
  setSelectedLog: React.Dispatch<React.SetStateAction<MOSDACLog | null>>
  selectedLogIndex: number
  setSelectedLogIndex: React.Dispatch<React.SetStateAction<number>>
  modeFetchingStatus: Map<MOSDACImageMode, number | boolean>
  mode: MOSDACImageMode
  setMode: React.Dispatch<React.SetStateAction<MOSDACImageMode>>
  opacity: number
  setOpacity: React.Dispatch<React.SetStateAction<number>>
  onLogSelect: (log: MOSDACLog, logIndex: number) => Promise<void>
  onModeSelect: (newMode: MOSDACImageMode) => Promise<void>
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
}

// Assets:
import { FrownIcon } from 'lucide-react'

// Constants:
import { BOXES } from '@/lib/box'

const ZOOM = 5
const MapContext = createContext<IMapContext>({
  isHistoryOn: false,
  setIsHistoryOn: () => {},
  logs: [],
  reversedLogs: [],
  historicalLogsFetchingStatus: new Map(),
  logDownloadStatus: new Map(),
  numberOfLogsDownloaded: 0,
  averageLogDownloadSpeed: 0,
  isFetchingImages: false,
  images: new Map(),
  layers: [],
  setImages: () => {},
  setLayers: () => {},
  selectedLog: null,
  setSelectedLog: () => {},
  selectedLogIndex: 0,
  setSelectedLogIndex: () => {},
  modeFetchingStatus: new Map(),
  mode: MOSDACImageMode.GREYSCALE,
  setMode: () => {},
  opacity: 0.85,
  setOpacity: () => {},
  onLogSelect: async (_log: MOSDACLog, _logIndex: number) => {},
  onModeSelect: async (_newMode: MOSDACImageMode) => {},
  zoom: ZOOM,
  setZoom: () => {},
})

// Context:
import UtilitiesContext from './UtilitiesContext'
import GlobalAnimationContext from './GlobalAnimationContext'

// Functions:
export const MapContextProvider = ({ children }: { children: React.ReactNode }) => {
  // Constants:
  const { setIsMOSDACDownDialogOpen } = useContext(UtilitiesContext)
  const {
    animationRangeIndices,
    setAnimationRangeIndices,
  } = useContext(GlobalAnimationContext)
  const { logs, isLoading: areLogsLoading, error: didLogsFetchThrowError } = useLogs()

  // Ref:
  const activeNetworkRequestsRef = useRef(0)
  const logDownloadStatusRef = useRef<Map<string, LogDownloadStatus>>(new Map())

  // State:
  const [isHistoryOn, setIsHistoryOn] = useState(false)
  const [historicalLogsFetchingStatus, setHistoricalLogsFetchingStatus] = useState<Map<string, number | boolean>>(new Map())
  const [logDownloadStatus, setLogDownloadStatus] = useState<Map<string, LogDownloadStatus>>(new Map())
  const [numberOfLogsDownloaded, setNumberOfLogsDownloaded] = useState(0)
  const [averageLogDownloadSpeed, setAverageLogDownloadSpeed] = useState(0)
  const [isFetchingImages, setIsFetchingImages] = useState(false)
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLog, setSelectedLog] = useState<MOSDACLog | null>(null)
  const [selectedLogIndex, setSelectedLogIndex] = useState(0)
  const [modeFetchingStatus, setModeFetchingStatus] = useState<Map<MOSDACImageMode, number | boolean>>(new Map())
  const [mode, setMode] = useState<MOSDACImageMode>(MOSDACImageMode.GREYSCALE)
  const [opacity, setOpacity] = useState(0.85)
  const [zoom, setZoom] = useState(ZOOM)

  // Memo:
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs])

  // Functions:
  const getMOSDACImageURL = useCallback((box: Box, log: MOSDACLog, mode: MOSDACImageMode) => {
    return `/api/history?bbox=${box.bbox}&date=${log.when.date}&month=${log.when.month}&year=${log.when.year}&formattedTimestamp=${log.when.formatted}&mode=${mode}`
  }, [])

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
              newHistoricalLogsFetchingStatus.set(log.name + '_' + mode, ++fetchedImageCount/requests.length)
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
    const key = log.name + '_' + mode

    try {
      setSelectedLog(log)
      setSelectedLogIndex(logIndex)

      if (logs.length > 0) {
        if (logIndex > logs.length - 1 - animationRangeIndices[0]) {
          setAnimationRangeIndices(_animationRangeIndices => [(logs.length - 1 - logIndex), _animationRangeIndices[1]])
        } else if (logIndex < logs.length - 1 - animationRangeIndices[1]) {
          setAnimationRangeIndices(_animationRangeIndices => [_animationRangeIndices[0], (logs.length - 1 - logIndex)])
        }
      }

      const status = logDownloadStatusRef.current.get(key)

      if (
        status !== undefined &&
        [
          LogDownloadStatus.DOWNLOADING,
          LogDownloadStatus.DOWNLOADED
        ].includes(status)
      ) return
      setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
        const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
        newHistoricalLogsFetchingStatus.set(key, 0)
        return newHistoricalLogsFetchingStatus
      })
      logDownloadStatusRef.current.set(key, LogDownloadStatus.DOWNLOADING)
      setLogDownloadStatus(_logDownloadStatus => {
        const newLogDownloadStatus = new Map(_logDownloadStatus)
        newLogDownloadStatus.set(key, LogDownloadStatus.DOWNLOADING)
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
        newHistoricalLogsFetchingStatus.delete(key)
        return newHistoricalLogsFetchingStatus
      })
      logDownloadStatusRef.current.set(key, LogDownloadStatus.DOWNLOADED)
      setLogDownloadStatus(_logDownloadStatus => {
        const newLogDownloadStatus = new Map(_logDownloadStatus)
        newLogDownloadStatus.set(key, LogDownloadStatus.DOWNLOADED)
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
        newHistoricalLogsFetchingStatus.set(key, false)
        return newHistoricalLogsFetchingStatus
      })
      logDownloadStatusRef.current.set(key, LogDownloadStatus.FAILED_TO_DOWNLOAD)
      setLogDownloadStatus(_logDownloadStatus => {
        const newLogDownloadStatus = new Map(_logDownloadStatus)
        newLogDownloadStatus.set(key, LogDownloadStatus.FAILED_TO_DOWNLOAD)
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

  // Effects:
  useEffect(() => {
    if (logs !== undefined && !areLogsLoading && !didLogsFetchThrowError && selectedLog === null) {
      setSelectedLog(logs[0])
      setSelectedLogIndex(logs.length - 1)
      setAnimationRangeIndices([logs.length - 1 - 10, logs.length - 1])
      onLogSelect(logs[0], 0)
    } else if ((logs === undefined || logs.length === 0) && !areLogsLoading && didLogsFetchThrowError && selectedLog === null) {
      console.error(`Upstream is fucked`, didLogsFetchThrowError)
      setIsMOSDACDownDialogOpen(true)
    }
  }, [logs, areLogsLoading, didLogsFetchThrowError, selectedLog])

  // Return:
  return (
    <MapContext.Provider
      value={{
        isHistoryOn,
        setIsHistoryOn,
        logs,
        reversedLogs,
        historicalLogsFetchingStatus,
        logDownloadStatus,
        numberOfLogsDownloaded,
        averageLogDownloadSpeed,
        layers,
        setLayers,
        isFetchingImages,
        images,
        setImages,
        selectedLog,
        setSelectedLog,
        selectedLogIndex,
        setSelectedLogIndex,
        modeFetchingStatus,
        mode,
        setMode,
        opacity,
        setOpacity,
        onLogSelect,
        onModeSelect,
        zoom,
        setZoom,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

// Exports:
export default MapContext
