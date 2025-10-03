// Packages:
import fetch from 'node-fetch'

// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

// Exports:
export const getMOSDACSnowURL = (bbox: string, time: string, date: string, month: string, year: string) => {  
  const URL = `https://mosdac.gov.in/live_data/wms/liveNew/products/Insat3s/3S_IMG`+
              `/${year}/${date}${month}/`+
              `3SIMG_${date}${month}${year}_${time}_L2C_SNW_V01R00.h5`+
              `?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng`+
              `&TRANSPARENT=true&LAYERS=SNW&CoLORSCALERANGE=1%2C1`+
              `&BELOWMINCOLOR=transparent&ABOVEMAXCOLOR=transparent&transparent=true&format=image%2Fpng&STYLES=boxfill%2Finsat_snw`+
              `&WIDTH=1024&HEIGHT=1024&CRS=EPSG%3A3857`+
              `&BBOX=${bbox}`

  return URL
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer<ArrayBuffer> | string>,
) {
  const { bbox, time, date, month, year } = req.query
  if (
    (bbox === undefined || typeof bbox !== 'string') ||
    (time === undefined || typeof time !== 'string') ||
    (date === undefined || typeof date !== 'string') ||
    (month === undefined || typeof month !== 'string') ||
    (year === undefined || typeof year !== 'string')
  ) return res.status(502).send('ERROR: Invalid query parameters')

  const URL = getMOSDACSnowURL(
    bbox,
    time,
    date,
    month,
    year,
  )

  const upstream = await fetch(URL)
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
