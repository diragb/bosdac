// Typescript:
import type { MOSDACWindDirectionData, MOSDACWindParameterData } from '@/pages/api/mosdac-wind-direction'

// Exports:
export interface WindLayerProps {
  wind: MOSDACWindVelocity
  options?: Record<string, unknown>
}

export interface MOSDACWindVelocity {
  data: [MOSDACWindParameterData, MOSDACWindParameterData]
  minVelocity: number
  maxVelocity: number
  velocityScale: number
}

export const toWindVelocityFormat = (raw: MOSDACWindDirectionData): MOSDACWindVelocity => {
  const u = raw.find(r => r.header.parameterNumber === 2)
  const v = raw.find(r => r.header.parameterNumber === 3)
  if (!u || !v) throw new Error('u/v pair missing')

  return {
    data: [u, v],
    minVelocity: 0,
    maxVelocity: 30,
    velocityScale: 0.003,
  }
}

export default toWindVelocityFormat
