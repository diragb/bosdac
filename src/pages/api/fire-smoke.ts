// Packages:
import fetch from 'node-fetch'

// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

export interface MOSDACFireSmokeFeature {
  type: 'Feature'
  geometry: {
    type: 'Point',
    coordinates: [number, number]
  },
  properties: {
    name: string
    date: string
    time: string
  }
}

export interface MOSDACFireSmoke {
  type: string
  features: MOSDACFireSmokeFeature[]
}

// Exports:
export const latestFireSmoke = async (): Promise<MOSDACFireSmoke> => {
  const url = 'https://mosdac.gov.in/live/backend/getfirejson.php'
  const MOSDACFireSmokeRawData = await (await fetch(url, { method: 'GET' })).text()
  const relevantMOSDACFireSmokeData = MOSDACFireSmokeRawData.split('$')[2]

  if (relevantMOSDACFireSmokeData) {
    return JSON.parse(relevantMOSDACFireSmokeData) as MOSDACFireSmoke
  } else throw new Error('ERROR: MOSDAC returned malformed data for fire & smoke')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MOSDACFireSmoke | string>,
) {
  try {
    const MOSDACFireSmoke = await latestFireSmoke()

    res.setHeader('content-type', 'application/json')
    res.status(200).json(MOSDACFireSmoke)
  } catch (error) {
    console.error(error)
    res.status(500).send('ERROR: MOSDAC did not return any MOSDACFireSmoke')
  }
}