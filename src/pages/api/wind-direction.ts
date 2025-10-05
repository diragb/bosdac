// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

export interface MOSDACWindParameterHeader {
  basicAngle: number
  center: number
  centerName: string
  discipline: number
  disciplineName: string
  dx: number
  dy: number
  forecastTime: number
  genProcessType: number
  genProcessTypeName: string
  gribEdition: number
  gribLength: number
  gridDefinitionTemplate: number
  gridDefinitionTemplateName: string
  gridUnits: string
  la1: number
  la2: number
  lo1: number
  lo2: number
  numberPoints: number
  nx: number
  ny: number
  parameterCategory: number
  parameterCategoryName: string
  parameterNumber: number
  parameterNumberName: string
  parameterUnit: string
  productDefinitionTemplate: number
  productDefinitionTemplateName: string
  productStatus: number
  productStatusName: string
  productType: number
  productTypeName: string
  refTime: string
  resolution: number
  scanMode: number
  shape: number
  shapeName: string
  significanceOfRT: number
  significanceOfRTName: string
  subcenter: number
  surface1Type: number
  surface1TypeName: string
  surface1Value: number
  surface2Type: number
  surface2TypeName: string
  surface2Value: number
  winds: string
}

export interface MOSDACWindParameterData {
  data: number[]
  header: MOSDACWindParameterHeader
}

export type MOSDACWindDirectionData = [MOSDACWindParameterData, MOSDACWindParameterData]

// Exports:
export const latestWindDirection = async (): Promise<MOSDACWindDirectionData> => {
  const url = 'https://mosdac.gov.in/live/json_files/cgrib_gfs_0.5deg.json'
  const MOSDACWindDirectionData: MOSDACWindDirectionData = (await (await fetch(url, { method: 'GET' })).json()) as MOSDACWindDirectionData

  return MOSDACWindDirectionData
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MOSDACWindDirectionData | string>,
) {
  try {
    const MOSDACWindDirection = await latestWindDirection()

    res.setHeader('content-type', 'application/json')
    res.status(200).json(MOSDACWindDirection)
  } catch (error) {
    console.error(error)
    res.status(500).send('ERROR: MOSDAC did not return any MOSDACWindDirection')
  }
}