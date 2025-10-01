// Packages:
import React, { useState, useEffect } from 'react'
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
const ADJUSTMENTS = [0, 1.25, 0.5, -1, -1.5, 0] as const
const BOXES = [
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

// Functions:
const Overlay = () => {
  // State:
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [isFetchingImages, setIsFetchingImages] = useState(false)
  const [logs, setLogs] = useState<MOSDACLogData>([])
  const [selectedLog, setSelectedLog] = useState<MOSDACLog | null>(null)
  const [mode, setMode] = useState<MOSDACImageMode>(MOSDACImageMode.GREYSCALE)

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
      const existingImages = new Map(images)
      const requests: Array<Promise<{ key: string, url: string }>> = []

      for (const boxRow of BOXES) {
        for (const box of boxRow) {
          const key = box.bbox + mode + log.when.formatted
          if (existingImages.has(key)) continue

          const imageURL = getMOSDACImageURL(box, log, mode)
          const req = new Promise<{ key: string, url: string }>(resolve => {
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
          requests.push(req)
        }
      }

      if (requests.length > 0) setIsFetchingImages(true)

      for (const request of requests) {
        request.then(({ key, url }) => {
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
      setIsFetchingImages(false)
    }
  }

  const onLogSelect = (log: MOSDACLog) => {
    fetchMOSDACImages(log)
    // selectedLogName.current = log.name

    // if (touchedLogsQueue.length >= TOUCHED_LOGS_LIMIT) onTouchedLogsQueueOverflow()

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

  // Return:
  return (
    <div className='absolute flex items-center justify-center flex-col w-screen h-screen'>
      {
        selectedLog !== null && BOXES.map((boxRow, index) => (
          <div key={index} className='flex items-center justify-center flex-row w-full'>
            {
              boxRow.map((box, jindex) => (
                <div
                  key={jindex}
                  className='relative w-40 h-40 bg-cover bg-center bg-no-repeat'
                  style={{
                    backgroundImage: `url(${images.get(box.bbox + mode + selectedLog.when.formatted) ?? ''})`,
                  }}
                />
              ))
            }
          </div>
        ))
      }
    </div>
  )
}

// Exports:
export default Overlay
