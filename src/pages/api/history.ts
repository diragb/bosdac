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
export const getMOSDACURL = (bbox: string, date: string, month: string, year: string, formattedTimestamp: string, mode?: MOSDACImageMode) => {
  let selectedMode: string | null = null
  switch (mode) {
    case MOSDACImageMode.REDBLUE:
      selectedMode = 'boxfill/redblue'
      break
    case MOSDACImageMode.RAINBOW:
      selectedMode = 'boxfill/rainbow'
      break
    case MOSDACImageMode.SST_36:
      selectedMode = 'boxfill/sst_36'
      break
    case MOSDACImageMode.FERRET:
      selectedMode = 'boxfill/ferret'
      break
    case MOSDACImageMode.NHC:
      selectedMode = 'boxfill/nhc'
      break
    case MOSDACImageMode.GREYSCALE:
    default:
      break
  }
  
  const URL =  `https://mosdac.gov.in/live_data/wms/live3SL1BSTD4km/products/`+
                  `Insat3s/3S_IMG/${year}/${date}${month}/`+
                  `3SIMG_${formattedTimestamp}_L1B_STD_V01R00.h5`+
                  `?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png`+
                  `&TRANSPARENT=true&LAYERS=IMG_TIR1&COLORSCALERANGE=267,1023`+
                  `&BELOWMINCOLOR=extend&ABOVEMAXCOLOR=extend&STYLES=boxfill/greyscale`+
                  `&CRS=EPSG:3857&WIDTH=1024&HEIGHT=1024`+
                  `&BBOX=${bbox}${selectedMode !== null ? `&styles=${selectedMode}` : ''}`

  return URL
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer<ArrayBuffer> | string>,
) {
  const { bbox, date, month, year, formattedTimestamp } = req.query
  let { mode } = req.query
  if (
    (bbox === undefined || typeof bbox !== 'string') ||
    (date === undefined || typeof date !== 'string') ||
    (month === undefined || typeof month !== 'string') ||
    (year === undefined || typeof year !== 'string') ||
    (formattedTimestamp === undefined || typeof formattedTimestamp !== 'string') ||
    typeof mode === 'object'
  ) return res.status(502).send('ERROR: Invalid query parameters')

  const URL = getMOSDACURL(
    bbox,
    date,
    month,
    year,
    formattedTimestamp,
    typeof mode === 'object' ? undefined : mode as MOSDACImageMode,
  )

  mode = mode === undefined ? MOSDACImageMode.GREYSCALE : mode

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
