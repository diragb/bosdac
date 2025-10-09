// Packages:
import useSWR from 'swr'
import axios, { AxiosResponse } from 'axios'

// Typescript:
import { MOSDACLog, MOSDACLogData } from '@/pages/api/log'

// Constants:
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

// Functions:
export const toSortableDateTimeKey = (log: MOSDACLog) => {
  const year = parseInt(log.when.year, 10)
  const month = MONTH_TO_NUM[log.when.month.toUpperCase()] ?? 0
  const date = parseInt(log.when.date, 10)

  const time = log.when.time.padStart(4, '0')
  const hours = parseInt(time.slice(0, 2), 10)
  const minutes = parseInt(time.slice(2), 10)

  return year * 1e8 + month * 1e6 + date * 1e4 + hours * 1e2 + minutes
}

export const sortLogs = (logs: MOSDACLogData) => {
  return [...logs].sort((a, b) => toSortableDateTimeKey(b) - toSortableDateTimeKey(a))
}

const useLogs = () => {
  // Constants:
  const { data: response, error, isLoading } = useSWR<AxiosResponse<MOSDACLogData>>('/api/log', axios, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  })
  
  // Return:
  return {
    logs: response?.data ? sortLogs(response?.data) : [],
    isLoading,
    error,
  }
}

// Exports:
export default useLogs
