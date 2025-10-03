// Packages:
import fetch from 'node-fetch'

// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

export enum MOSDACImageMode {
  GREYSCALE = 'GREYSCALE',
  REDBLUE = 'REDBLUE',
  RAINBOW = 'RAINBOW',
  SST_36 = 'SST_36',
  FERRET = 'FERRET',
  NHC = 'NHC',
}

// Exports:
export const getMOSDACRipCurrentInfo = async (date: string, hour: string) => {
  const url = `https://mosdac.gov.in/live/backend/get_rip_current_info.php?date_val=${date}&time_val=${hour}`
  const MOSDACRipCurrentInfo = await (await fetch(url, { method: 'GET' })).text()

  return MOSDACRipCurrentInfo
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer<ArrayBuffer> | string>,
) {
  const { date, hour } = req.query

  if (
    (date === undefined || typeof date !== 'string') ||
    (hour === undefined || typeof hour !== 'string')
  ) return res.status(502).send('ERROR: Invalid query parameters')

  let MOSDACRipCurrentInfo: string | null = null

  try {
    MOSDACRipCurrentInfo = await getMOSDACRipCurrentInfo(date, hour)
    if (MOSDACRipCurrentInfo === null) throw new Error()
  } catch (error) {
    return res.status(502).send('ERROR: MOSDAC did not return any data.')
  }
  
  const upstream = await fetch(
    `https://mosdac.gov.in/geoserver_2/beach/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=beach%3Aindia_beaches_view&transparent=true&singleTile=true&CQL_FILTER=forecast_date%3D%27${date}%27%20AND%20forecast_time%3D%27${encodeURI(MOSDACRipCurrentInfo)}%27&STYLES=&CRS=EPSG%3A3857&WIDTH=2777&HEIGHT=2198&BBOX=-2730952.544336615%2C-6761852.148524264%2C20921906.544336617%2C11959424.148524264`
  )
  if (!upstream.ok) {
    return res.status(upstream.status).send('ERROR: MOSDAC did not return any data.')
  }

  let buf: Buffer<ArrayBuffer>
  const ctype = upstream.headers.get('content-type') || ''
  if (ctype.includes('image/png')) {
    buf = Buffer.from(await upstream.arrayBuffer())
  } else {
    const hex = (await upstream.text()).trim().replace(/\s+/g, '')
    if (!/^[0-9a-f]+$/i.test(hex)) return res.status(502).send('ERROR: MOSDAC returned invalid data')
    buf = Buffer.from(hex, 'hex')
  }

  res.setHeader('cache-control', 'public,max-age=3600')
  res.setHeader('content-type', 'image/png')
  res.status(200).send(buf)
}
