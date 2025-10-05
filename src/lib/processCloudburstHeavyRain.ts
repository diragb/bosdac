// Typescript:
import { MOSDACCloudburstAndHeavyRain } from '@/pages/api/cloudburst-and-heavy-rain'

export interface RainPoint {
  id: string
  lat: number
  lng: number
  type: 'heavy-rain-forecast' | 'cloudburst' | 'heavy-rain' | 'other'
  intensity: number
}

export interface CloudburstHeavyRainProcessedData {
  heavyRainForecastPoints: RainPoint[]
  cloudburstPoints: RainPoint[]
  heavyRainPoints: RainPoint[]
  otherPoints: RainPoint[]
}

// Functions:
const processCloudburstHeavyRain = (data: MOSDACCloudburstAndHeavyRain) => {
  let index = 0

  const heavyRainForecastPoints: RainPoint[] = []
  const cloudburstPoints: RainPoint[] = []
  const heavyRainPoints: RainPoint[] = []
  const otherPoints: RainPoint[] = []

  for (const datum of data.features) {
    switch (datum.properties.name) {
      case 'HeavyRain':
        heavyRainForecastPoints.push({
          id: `${index}`,
          lat: datum.geometry.coordinates[1],
          lng: datum.geometry.coordinates[0],
          type: 'heavy-rain-forecast',
          intensity: datum.properties.rad_inf,
        })
        break
      case 'Cloudburst':
        cloudburstPoints.push({
          id: `${index}`,
          lat: datum.geometry.coordinates[1],
          lng: datum.geometry.coordinates[0],
          type: 'cloudburst',
          intensity: datum.properties.rad_inf,
        })
        break
      case 'HEAVY RAIN':
        heavyRainPoints.push({
          id: `${index}`,
          lat: datum.geometry.coordinates[1],
          lng: datum.geometry.coordinates[0],
          type: 'heavy-rain',
          intensity: datum.properties.value,
        })
        break
      default:
        otherPoints.push({
          id: `${index}`,
          lat: datum.geometry.coordinates[1],
          lng: datum.geometry.coordinates[0],
          type: 'other',
          intensity: (datum.properties as unknown as { value?: number })?.value ?? 0.5,
        })
        break
    }

    index++
  }

  return {
    heavyRainForecastPoints,
    cloudburstPoints,
    heavyRainPoints,
    otherPoints,
  }
}

// Exports:
export default processCloudburstHeavyRain
