// Typescript:
import type { MOSDACLog } from '@/pages/api/log'
import type { Box } from './box'
import type { MOSDACImageMode } from '@/pages/api/history'

// Exports:
export const getMOSDACImageURL = (box: Box, log: MOSDACLog, mode: MOSDACImageMode) => {
  return `/api/history?bbox=${box.bbox}&date=${log.when.date}&month=${log.when.month}&year=${log.when.year}&formattedTimestamp=${log.when.formatted}&mode=${mode}`
}
