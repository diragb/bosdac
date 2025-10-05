// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

export interface MOSDACSnowInfo {
  time: string
  date: string
  month: string
  year: string
}

// Constants:
const MOSDAC_SNOW_INFO_URL = 'https://mosdac.gov.in/live/backend/satellite_data_initial.php?file_prefix=3SIMG&file_extension=L2C_SNW_V01R00&param=addlayer&timezone=local&timezone_formal=-19800'

// Exports:
export const getMOSDACSnowInfo = async (): Promise<MOSDACSnowInfo> => {
  const upstream = await fetch(MOSDAC_SNOW_INFO_URL, { method: 'GET' })
  if (!upstream.ok) throw new Error('Upstream not OK')
  const raw = await upstream.text()
  const text = (raw || '').trim()
  if (text.length === 0) throw new Error('Invalid or empty upstream data')
  const components = text.split(',')
  const subcomponents = components[components.length - 1].split('*')

  const [datestamp, time] = subcomponents[subcomponents.length - 1].split(';')[0].split(' ')
  const [date, month, year] = datestamp.split('-')

  return {
    time,
    date,
    month,
    year,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MOSDACSnowInfo | string>,
) {
  let info: MOSDACSnowInfo
  try {
    info = await getMOSDACSnowInfo()
  } catch {
    return res.status(502).send('ERROR: MOSDAC did not return valid data.')
  }

  res.setHeader('cache-control', 'public,max-age=3600')
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  return res.status(200).send(info)
}
