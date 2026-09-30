export const MONTHS = [
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
] as const

export type Month = (typeof MONTHS)[number]

export type Place = {
  id: string
  country: string
  region: string
  symbols: readonly string[]
  availability: Readonly<Record<string, readonly Month[]>>
}

export type PlacesDataset = {
  criteria: readonly string[]
  places: readonly Place[]
}
