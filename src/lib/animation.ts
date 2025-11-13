// Packages:
import axios from 'axios'
import { getMOSDACImageURL } from './map'
import localforage from 'localforage'
import xonsole from './xonsole'
import returnable from './returnable'
import sleep from 'sleep-promise'

// Typescript:
import type { Returnable } from '@/types/helpers'
import type { MOSDACLog } from '@/pages/api/log'
import type { MOSDACImageMode } from '@/pages/api/history'
import type { Box } from './box'

// Constants:
import { BOXES } from './box'
import { ANIMATION_SPEEDS } from '@/context/AnimationContext'

// Exports:
export const getLeafletTile = async (tileURL: string): Promise<Returnable<string, Error>> => {
  try {
    const data = (await axios.get<Blob>(tileURL, { responseType: 'blob' })).data
    return returnable.success(URL.createObjectURL(data))
  } catch (error) {
    xonsole.error('getLeafletTile', error as Error, { tileURL })
    return returnable.fail(error as Error)
  }
}

export const getFourLeafletTilesInImageOverlayTile = async (
  images: [string, string, string, string],
  maxRetries = 3
): Promise<Returnable<[string, string, string, string], Error>> => {
  try {
    const tiles: [string, string, string, string] = ['', '', '', '']
    const failed = new Set<string>(images)

    for (let attempt = 0; attempt < maxRetries && failed.size > 0; ++attempt) {
      const results = await Promise.allSettled(
        Array.from(failed).map(async tileURL => {
          const { status, payload } = await getLeafletTile(tileURL)
          return { tileURL, status, payload } as const
        })
      )
  
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.status && typeof result.value.payload === 'string') {
          const index = images.findIndex(image => image === result.value.tileURL)
          tiles[index] = result.value.payload
          failed.delete(result.value.tileURL)
        }
      }
    }

    return returnable.success(tiles)
  } catch (error) {
    xonsole.error('getFourLeafletTilesInImageOverlayTile', error as Error, { images, maxRetries })
    return returnable.fail(error as Error)
  }
}

export const fetchImageOverlayTile = async (box: Box, log: MOSDACLog, mode: MOSDACImageMode): Promise<Returnable<string, Error>> => {
  try {
    const imageURL = getMOSDACImageURL(box, log, mode)
    const data = (await axios.get<Blob>(imageURL, { responseType: 'blob' })).data
    return returnable.success(URL.createObjectURL(data))
  } catch (error) {
    xonsole.error('fetchImageOverlayTile', error as Error, { box, log, mode })
    return returnable.fail(error as Error)
  }
}

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((res, rej) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => res(img)
  img.onerror = rej
  img.src = src
})

export const getProcessedImageOverlayTile = async ({
  box,
  leafletTileURLs,
  log,
  mode,
  opacity,
}: {
  box: Box
  leafletTileURLs: [string, string, string, string]
  log: MOSDACLog
  mode: MOSDACImageMode
  opacity: number
}) => {
  try {
    let imageOverlayObjectURL = ''
    const key = box.bbox + mode + log.when.formatted
    const cachedImageBlob = await localforage.getItem<Blob>(key)
    if (cachedImageBlob !== null) imageOverlayObjectURL = URL.createObjectURL(cachedImageBlob)
    else {
      const fetchImageOverlayTileResult = await fetchImageOverlayTile(box, log, mode)
      if (fetchImageOverlayTileResult.status) {
        imageOverlayObjectURL = fetchImageOverlayTileResult.payload
      } else throw fetchImageOverlayTileResult.payload
    }

    if (imageOverlayObjectURL.length === 0) throw new Error('Failed to fetch image overlay!')

    const { status, payload } = await getFourLeafletTilesInImageOverlayTile(leafletTileURLs)
    if (!status) throw payload

    const [i00, i10, i01, i11, overlay] = await Promise.all([
      ...payload.map(loadImage),
      loadImage(imageOverlayObjectURL),
    ])

    const imageSize = 512
    const tileSize = 256

    const canvas = document.createElement('canvas')
    canvas.width = imageSize
    canvas.height = imageSize
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(i00, 0,        0,        tileSize, tileSize)
    ctx.drawImage(i01, tileSize, 0,        tileSize, tileSize)
    ctx.drawImage(i10, 0,        tileSize, tileSize, tileSize)
    ctx.drawImage(i11, tileSize, tileSize, tileSize, tileSize)

    ctx.globalAlpha = opacity
    ctx.drawImage(overlay, 0, 0, imageSize, imageSize)

    const processedImageBlob = await new Promise<Blob>(resolve => {
      canvas.toBlob(b => resolve(b!), 'image/png')
    })
    canvas.remove()

    return returnable.success(processedImageBlob)
  } catch (error) {
    xonsole.error('getProcessedImageOverlayTile', error as Error, { box, leafletTileURLs, log, mode })
    return returnable.fail(error as Error)
  }
}

export interface AnimationDimensions {
  x: number
  y: number
  length: number
  breadth: number
}

export const getAnimationDimensions = (selectedTileKeys: Set<string>): AnimationDimensions => {
  if (selectedTileKeys.size === 1) {
    const indices = [...selectedTileKeys][0].split('-'), index = parseInt(indices[0]), jindex = parseInt(indices[1])
    const box = BOXES[index][jindex]
    return {
      x: box.x,
      y: box.y,
      length: box.length,
      breadth: box.breadth,
    }
  }

  const selectedTileKeysArray = Array(...selectedTileKeys)
  const selectedTiles: (Box & { index: number, jindex: number })[] = []

  let smallestX = Infinity, smallestY = Infinity, largestX = -Infinity, largestY = -Infinity
  for (const selectedTileKey of selectedTileKeysArray) {
    const indices = selectedTileKey.split('-'), index = parseInt(indices[0]), jindex = parseInt(indices[1])
    const box = BOXES[index][jindex]
    if (box) {
      selectedTiles.push({
        ...box,
        index,
        jindex,
      })
      if (box.x < smallestX) smallestX = box.x
      if (box.y < smallestY) smallestY = box.y
      if (box.x > largestX) largestX = box.x
      if (box.y > largestY) largestY = box.y
    }
  }

  let smallestBox: Box | null = null
  let largestBox: Box | null = null

  for (let i = 0; i < BOXES[0].length; i++) {
    const box = BOXES[0][i]
    const startX = box.x, startY = box.y
    const endX = box.x + box.length - 1, endY = box.y + box.breadth - 1
    if (
      smallestBox === null &&
      startX <= smallestX && smallestX <= endX &&
      startY <= smallestY && smallestY <= endY
    ) smallestBox = box

    if (
      largestBox === null &&
      startX <= largestX && largestX <= endX &&
      startY <= largestY && largestY <= endY
    ) largestBox = box
  }

  if (
    smallestBox === null ||
    largestBox === null
  ) throw new Error('Unable to find smallest and/or largest box.')

  return {
    x: smallestBox.x,
    y: smallestBox.y,
    length: ((largestBox.x - 1) + largestBox.length) - (smallestBox.x - 1),
    breadth: ((largestBox.y - 1) + largestBox.breadth) - (smallestBox.y - 1),
  }
}

export const createAnimationCanvas = (dimensions: AnimationDimensions) => {
  const unitSize = 512
  const width = dimensions.length * unitSize
  const height = dimensions.breadth * unitSize

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  return {
    canvas,
    width,
    height,
  }
}

export const getFrame = async ({
  selectedTiles,
  tileURLsForSelectedTiles,
  log,
  mode,
  opacity,
}: {
  selectedTiles: Set<string>
  tileURLsForSelectedTiles: Map<string, [string, string, string, string]>
  log: MOSDACLog
  mode: MOSDACImageMode
  opacity: number
}) => {
  const overlayImageSize = 512
  const dimensions = getAnimationDimensions(selectedTiles)
  const { canvas } = createAnimationCanvas(dimensions)
  const ctx = canvas.getContext('2d')!

  const selectedTileKeysArray = Array(...selectedTiles)
  const selectedBoxes: (Box & { index: number, jindex: number })[] = []

  for (const selectedTileKey of selectedTileKeysArray) {
    const indices = selectedTileKey.split('-'), index = parseInt(indices[0]), jindex = parseInt(indices[1])
    const box = BOXES[index][jindex]
    if (box) selectedBoxes.push({
      ...box,
      index,
      jindex,
    })
  }

  const renderOperations: { i: number; j: number; key: string }[] = []
  const bitmapPromises = new Map<string, Promise<ImageBitmap | null>>()

  for (let x = dimensions.x, i = 0; x < dimensions.x + dimensions.length; x++, i++) {
    for (let y = dimensions.y, j = 0; y < dimensions.y + dimensions.breadth; y++, j++) {
      const selectedBox = selectedBoxes.find(_selectedBox => (
        _selectedBox.x <= x && x <= (_selectedBox.x - 1 + _selectedBox.length) &&
        _selectedBox.y <= y && y <= (_selectedBox.y - 1 + _selectedBox.breadth)
      ))
      if (!selectedBox) continue

      const key = `${selectedBox.index}-${selectedBox.jindex}`
      const leafletTileURLs: [string, string, string, string] | undefined = tileURLsForSelectedTiles.get(key)
      if (!leafletTileURLs) continue

      if (!bitmapPromises.has(key)) {
        bitmapPromises.set(key, (async () => {
          try {
            const { status, payload } = await getProcessedImageOverlayTile({
              box: selectedBox,
              leafletTileURLs,
              log,
              mode,
              opacity,
            })
            if (!status) return null
            return await createImageBitmap(payload)
          } catch (error) {
            xonsole.error('getFrame:getProcessedImageOverlayTile', error as Error, { key, log, mode })
            return null
          }
        })())
      }

      renderOperations.push({ i, j, key })
    }
  }

  if (renderOperations.length > 0) {
    const resolvedBitmaps = new Map<string, ImageBitmap | null>(
      await Promise.all(
        Array.from(bitmapPromises.entries()).map(async ([key, promise]) => {
          const bitmap = await promise
          return [key, bitmap] as const
        })
      )
    )

    for (const { i, j, key } of renderOperations) {
      const bitmap = resolvedBitmaps.get(key)
      if (!bitmap) continue
      ctx.drawImage(bitmap, i * overlayImageSize, j * overlayImageSize, overlayImageSize, overlayImageSize)
    }

    for (const bitmap of resolvedBitmaps.values()) {
      if (bitmap) bitmap.close()
    }
  }

  const processedImageBlob = await new Promise<Blob>(resolve => {
    canvas.toBlob(b => resolve(b!), 'image/png')
  })
  canvas.remove()

  return {
    frame: processedImageBlob,
    dimensions,
  }
}

const loadBitmap = async (image: Blob): Promise<ImageBitmap> => await createImageBitmap(image)

export const getAnimation = async ({
  selectedTiles,
  tileURLsForSelectedTiles,
  reversedLogs,
  animationRangeIndices,
  mode,
  opacity,
  selectedAnimationSpeed,
}: {
  selectedTiles: Set<string>
  tileURLsForSelectedTiles: Map<string, [string, string, string, string]>
  reversedLogs: MOSDACLog[]
  animationRangeIndices: [number, number]
  mode: MOSDACImageMode
  opacity: number
  selectedAnimationSpeed: typeof ANIMATION_SPEEDS[number]
}) => {
  const logs = reversedLogs.slice(animationRangeIndices[0], animationRangeIndices[1] + 1)
  const frames = await Promise.all(
    logs.map(log => getFrame({
      log,
      mode,
      opacity,
      selectedTiles,
      tileURLsForSelectedTiles,
    }))
  )

  const unitOverlayImageSize = 512
  const width = frames[0].dimensions.length * unitOverlayImageSize
  const height = frames[0].dimensions.breadth * unitOverlayImageSize

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.position = 'fixed'
  canvas.style.top = '-9999px'
  canvas.style.left = '-9999px'
  document.body.appendChild(canvas)
  
  const ctx = canvas.getContext('2d', { alpha: false })!
  ctx.imageSmoothingEnabled = false
  
  const bitmaps = await Promise.all(frames.map(frame => frame.frame).map(loadBitmap))
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  const firstBitmap = bitmaps[0]
  ctx.drawImage(firstBitmap, 0, 0, firstBitmap.width, firstBitmap.height)
  
  await new Promise(resolve => requestAnimationFrame(() => resolve(null)))

  let codec = 'video/webm;codecs=vp9'
  if (!MediaRecorder.isTypeSupported(codec)) {
    codec = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm'
  }
  const fps = Math.max(1, Math.round(1000 / selectedAnimationSpeed.value))
  const stream = canvas.captureStream(fps)
  const estimatedBitrate = Math.min(100_000_000, Math.max(20_000_000, Math.round(width * height * fps * 0.5)))
  const rec = new MediaRecorder(stream, { mimeType: codec, videoBitsPerSecond: estimatedBitrate })

  const chunks: BlobPart[] = []
  rec.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }

  const started = new Promise<void>(res => rec.onstart = () => res())
  const stopped = new Promise<void>(res => rec.onstop = () => res())

  rec.start(100)
  await started
  // await new Promise(r => setTimeout(r, selectedAnimationSpeed.value))
  await sleep(selectedAnimationSpeed.value)

  for (let i = 1; i < bitmaps.length; i++) {
    const bitmap = bitmaps[i]    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)    
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height)
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
    // await new Promise(r => setTimeout(r, selectedAnimationSpeed.value))
    await sleep(selectedAnimationSpeed.value)
  }

  await new Promise(r => setTimeout(r, 100))
  rec.stop()
  await stopped
  canvas.remove()

  return new Blob(chunks, { type: codec })
}
