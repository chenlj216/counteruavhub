import dronesData from './drones.json'

export type DroneCategory = 'consumer' | 'industrial' | 'fpv' | 'military'
export type SourceTier = 'official' | 'fcc' | 'third-party'

export interface DroneRecord {
  id: string
  name: string
  brand: string
  category: DroneCategory
  controlFreq: string
  videoProtocol: string
  videoFreq: string
  gpsFreq: string
  maxTxPower: string
  counterFreq: string
  source: string
  sourceTier: SourceTier
  sourceUrl?: string
  controlFreqMHz: number[]
  gcsTxPowerDbm: number
  controlChannelBW_MHz: number
}

export const drones = dronesData as DroneRecord[]

export const brands = [...new Set(drones.map((d) => d.brand))].sort((a, b) => a.localeCompare(b))
export const categories: DroneCategory[] = ['consumer', 'industrial', 'fpv', 'military']
