// Packages:
import fetch from 'node-fetch'

// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

export interface HeavyRainForecastFeatureProperties {
  name: 'HeavyRain'
  forecast: 'Heavy Rain'
  rad_inf: number
  forecast_date: string
  forecast_time: string
}

export interface CloudburstFeatureProperties {
  name: 'Cloudburst'
  forecast: 'Heavy Rain with Cloudburst'
  rad_inf: number
  forecast_date: string
  forecast_time: string
}

export interface HeavyRainFeatureProperties {
  name: 'HEAVY RAIN'
  value: number
  event_date: string
  event_time: string
}

export interface MOSDACCloudburstAndHeavyRainFeature {
  type: 'Feature'
  geometry: {
    type: 'Point',
    coordinates: [number, number]
  },
  properties: HeavyRainForecastFeatureProperties |
              CloudburstFeatureProperties |
              HeavyRainFeatureProperties
}

export interface MOSDACCloudburstAndHeavyRain {
  type: 'FeatureCollection'
  features: MOSDACCloudburstAndHeavyRainFeature[]
}

// Exports:
export const latestCloudburstAndHeavyRain = async (): Promise<MOSDACCloudburstAndHeavyRain> => {
  const url = 'https://mosdac.gov.in/live/backend/rain_cloudburst.php'
  const MOSDACCloudburstAndHeavyRainData = await (await fetch(url, { method: 'GET' })).text()
  const relevantMOSDACCloudburstAndHeavyRainData = MOSDACCloudburstAndHeavyRainData.split('$')[2]

  if (relevantMOSDACCloudburstAndHeavyRainData) {
    return JSON.parse(relevantMOSDACCloudburstAndHeavyRainData) as MOSDACCloudburstAndHeavyRain
  } else {
    console.log(MOSDACCloudburstAndHeavyRainData)
    throw new Error('ERROR: MOSDAC returned malformed data for cloudburst and heavy rain')
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MOSDACCloudburstAndHeavyRain | string>,
) {
  try {
    const MOSDACCloudburstAndHeavyRainData = await latestCloudburstAndHeavyRain()

    res.setHeader('content-type', 'application/json')
    res.status(200).json(MOSDACCloudburstAndHeavyRainData)
  } catch (error) {
    console.error(error)
    res.status(500).send('ERROR: MOSDAC did not return any MOSDACCloudburstAndHeavyRainData')
  }
}
