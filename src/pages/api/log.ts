// Packages:
import fetch from 'node-fetch'

// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

export interface MOSDACLog {
  name: string
  when: {
    date: string
    month: string
    year: string
    time: string
    formatted: string
  }
}

export type MOSDACLogData = Array<MOSDACLog>

// Exports:
export const latestStdH5 = async (): Promise<MOSDACLogData> => {
  const url = 'https://mosdac.gov.in/live/backend/satellite_data_initial.php' +
              '?file_prefix=IMG&file_extension=L1B_STD' +
              '&param=startlayer&timezone=local&timezone_formal=-19800'

  const txt = await (await fetch(url, { method: 'GET' })).text()
  const response = txt.trim().split(',').filter(Boolean)
  const MOSDACLogData: MOSDACLogData = []
  
  response.forEach(_response => {
    // const last = txt.trim().split(',').filter(Boolean).pop() ?? ''
    const [name, dirtyWhen] = _response.split('*')
    if (!name.startsWith('3R')) {
      const when = dirtyWhen.split(';')[0]
      const [date, month, dirtyYear] = when.split('-')
      const [year, time] = dirtyYear.split(' ')
      const formatted = when.replaceAll(' ', '_').replaceAll('-', '')
      
      MOSDACLogData.push({
        name,
        when: {
          date,
          month,
          year,
          time,
          formatted,
        }
      })
    }
  })

  return MOSDACLogData
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MOSDACLogData | string>,
) {
  try {
    const MOSDACLogData = await latestStdH5()

    res.setHeader('content-type', 'application/json')
    res.status(200).json(MOSDACLogData)
  } catch (error) {
    console.error(error)
    res.status(500).send('ERROR: MOSDAC did not return any MOSDACLogData')
  }
}