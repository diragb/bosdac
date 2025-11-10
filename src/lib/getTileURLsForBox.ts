// Typescript:
import type { Box } from './box'

// Functions:
const getTileURL = ({
  z,
  x,
  y,
}: {
  z: number
  x: number
  y: number
}) => `https://${['a','b','c'][(x + y) % 3]}.tile.openstreetmap.org/${z}/${x}/${y}.png`

export const getTileURLsForBox = ({
  z,
  box,
}: {
  z: number
  box: Box
}): [string, string, string, string] => {
  const eps = 1e-9
  const n = 2 ** z

  const defensiveAntiMeridianClamp = (v: number) => Math.max(0, Math.min(n - 1, v))
  const merc = (latDeg: number) => {
    const angle = latDeg * Math.PI / 180
    return (1 - Math.log(Math.tan(angle) + 1 / Math.cos(angle)) / Math.PI) / 2
  }

  const x0 = defensiveAntiMeridianClamp(Math.floor((box.bounds.west + 180) / 360 * n))
  const x1 = defensiveAntiMeridianClamp(Math.floor(((box.bounds.east  + 180) / 360) * n - eps))
  const y0 = defensiveAntiMeridianClamp(Math.floor(merc(box.bounds.north) * n))
  const y1 = defensiveAntiMeridianClamp(Math.floor( merc(box.bounds.south) * n - eps))

  return [
    getTileURL({ z, x: x0, y: y0 }),
    getTileURL({ z, x: x0, y: y1 }),
    getTileURL({ z, x: x1, y: y0 }),
    getTileURL({ z, x: x1, y: y1 }),
  ]
}

// Exports:
export default getTileURLsForBox
