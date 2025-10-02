// Typescript:
import type { MOSDACFireSmokeFeature } from '@/pages/api/mosdac-fire-smoke'

// Exports:
export interface FirePoint {
  id: string
  lat: number
  lng: number
}

export const toFirePoint = (id: string | number, raw: MOSDACFireSmokeFeature): FirePoint => {
  return {
    id: id.toString(),
    lat: raw.geometry.coordinates[1],
    lng: raw.geometry.coordinates[0],
  }
}

export default toFirePoint
