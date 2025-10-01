// Packages:
import dynamic from 'next/dynamic'
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { cn } from '@/lib/utils'
import localforage from 'localforage'

// Typescript:
import type { MOSDACLogData, MOSDACLog } from './api/mosdac-log'
import { MOSDACImageMode } from './api/mosdac'

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
// const ADJUSTMENTS = [0, 1.25, 0.5, -1, -1.5, 0] as const
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
const TOUCHED_LOG_TTL = 60 * 1000

// Components:
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import LayersCombobox from '@/components/LayersCombobox'
import HistoryCombobox from '@/components/HistoryCombobox'
const LeafletMap = dynamic(() => import('../components/LeafletMap'), { ssr: false })

// Functions:
const Leaflet = () => {
  // Ref:
  const selectedLogName = useRef<string | null>(null)

  // State:
  const [images, setImages] = useState<Map<string, string>>(new Map())
  // const [isFetchingImages, setIsFetchingImages] = useState(false)
  const [historicalLogsFetchingStatus, setHistoricalLogsFetchingStatus] = useState<Map<string, number>>(new Map())
  const [logs, setLogs] = useState<MOSDACLogData>([])
  const [selectedLog, setSelectedLog] = useState<MOSDACLog | null>(null)
  const [touchedLogsTTLIntervals, setTouchedLogsTTLIntervals] = useState<Map<string, ReturnType<typeof setInterval>>>(new Map())
  const [touchedLogsQueue, setTouchedLogsQueue] = useState<MOSDACLog[]>([])
  const [mode, setMode] = useState<MOSDACImageMode>(MOSDACImageMode.GREYSCALE)
  const [opacity, setOpacity] = useState(0.85)
  const [isAnimationOn, setIsAnimationOn] = useState(false)
  const [legends, setLegends] = useState<string[]>([])

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

  const fetchMOSDACImages = async (log: MOSDACLog) => {
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

      // if (requests.length > 0) setIsFetchingImages(true)

      for (const request of requests) {
        request.then(({ key, url }) => {
          setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
            const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
            newHistoricalLogsFetchingStatus.set(log.name, ++fetchedImageCount/requests.length)
            return newHistoricalLogsFetchingStatus
          })
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
    
    } finally {
      // setIsFetchingImages(false)
    }
  }

  const onTouchedLogsQueueOverflow = () => {
    // if (touchedLogsQueue.length < 1 || touchedLogsQueue.length < TOUCHED_LOGS_LIMIT) return
    
    const newTouchedLogsQueue = [...touchedLogsQueue]
    const oldestLogToPop = newTouchedLogsQueue.shift()
    if (oldestLogToPop === undefined) return

    setTouchedLogsTTLIntervals(_touchedLogsTTLIntervals => {
      const newTouchedLogsTTLIntervals = new Map(_touchedLogsTTLIntervals)
      newTouchedLogsTTLIntervals.delete(oldestLogToPop.name)
      return newTouchedLogsTTLIntervals
    })
    setTouchedLogsQueue(newTouchedLogsQueue)
  }

  const onLogSelect = (log: MOSDACLog) => {
    setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
      const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
      newHistoricalLogsFetchingStatus.set(log.name, 0)
      return newHistoricalLogsFetchingStatus
    })
    setSelectedLog(log)
    fetchMOSDACImages(log).then(() => {
      setHistoricalLogsFetchingStatus(_historicalLogsFetchingStatus => {
        const newHistoricalLogsFetchingStatus = new Map(_historicalLogsFetchingStatus)
        newHistoricalLogsFetchingStatus.delete(log.name)
        return newHistoricalLogsFetchingStatus
      })
    })
    selectedLogName.current = log.name

    // // if (touchedLogsQueue.length >= TOUCHED_LOGS_LIMIT) onTouchedLogsQueueOverflow()

    // if (touchedLogsTTLIntervals.has(log.name)) clearInterval(touchedLogsTTLIntervals.get(log.name))

    // const interval = setInterval(() => {
    //   if (log.name === selectedLogName.current) return
    //   setTouchedLogsTTLIntervals(_touchedLogsTTLIntervals => {
    //     const newTouchedLogsTTLIntervals = new Map(_touchedLogsTTLIntervals)
    //     newTouchedLogsTTLIntervals.delete(log.name)
    //     return newTouchedLogsTTLIntervals
    //   })
    //   setTouchedLogsQueue(_touchedLogsQueue => {
    //     return _touchedLogsQueue.filter(_touchedLog => _touchedLog.name !== log.name)
    //   })
    //   clearInterval(interval)
    // }, TOUCHED_LOG_TTL)

    // const newTouchedLogsTTLIntervals = new Map(touchedLogsTTLIntervals)
    // newTouchedLogsTTLIntervals.set(log.name, interval)
    // setTouchedLogsTTLIntervals(newTouchedLogsTTLIntervals)

    // if (!touchedLogsTTLIntervals.has(log.name)) setTouchedLogsQueue(_touchedLogsQueue => [..._touchedLogsQueue, log])
  }

  // Effects:
  useEffect(() => {
    getMOSDACLogData()
  }, [])

  useEffect(() => {
    console.log(touchedLogsQueue)
  }, [touchedLogsQueue])

  // Return:
  return (
    <div className='relative w-screen h-screen bg-slate-400 overflow-hidden'>
      <div className='absolute right-3 top-3 z-[1001] flex justify-center items-center flex-col gap-2 w-42 p-3 bg-white rounded'>
        <LayersCombobox />
        {
          logs.length > 0 && (
            <HistoryCombobox
              logs={logs}
              selectedLog={selectedLog}
              onSelect={onLogSelect}
              historicalLogsFetchingStatus={historicalLogsFetchingStatus}
            />
          )
        }
        <Button variant='outline' className='relative w-full cursor-pointer'>
          <div className={cn('absolute top-1.5 right-1.5 z-10 w-1.5 h-1.5 rounded-full transition-all', isAnimationOn ? 'bg-green-500' : 'bg-rose-400')} />
          Animation
        </Button>
        <Button variant='outline' className='relative w-full cursor-pointer'>
          {
            legends.length > 0 && (
              <div className='absolute -top-2 -right-2 z-10 flex justify-center items-center w-4 h-4 text-xs text-[10px] text-white bg-blue-600 rounded-full'>{legends.length}</div>
            )
          }
          Legends
        </Button>
      </div>
      <LeafletMap
        images={images}
        mode={mode}
        opacity={0.75}
        selectedLog={selectedLog}
      />
      <Footer />
    </div>
  )
}

// Exports:
export default Leaflet
