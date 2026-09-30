import {
  MONTHS,
  type Month,
  type Place,
  type PlacesDataset,
} from "@/data/model"

type AirtableSelect = {
  name: string
}

type AirtableValue = string | readonly AirtableSelect[] | null

export type AirtableRecord = {
  id: string
  fields: Record<string, AirtableValue | undefined>
}

export type AirtablePlaceMapping = {
  countryField: string
  regionField: string
  symbolsField: string
  criteriaByField: Readonly<Record<string, string>>
}

const isMonth = (value: string): value is Month =>
  MONTHS.includes(value as Month)

const asStrings = (value: AirtableValue | undefined): string[] => {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.map(({ name }) => name)
  return []
}

/**
 * Converts Airtable records into the stable model used by the interface.
 * Field names live in the mapping so no Airtable-specific assumption leaks
 * into filtering or rendering.
 */
export function createPlacesDataset(
  records: readonly AirtableRecord[],
  mapping: AirtablePlaceMapping
): PlacesDataset {
  const places: Place[] = records.map((record) => ({
    id: record.id,
    country: asStrings(record.fields[mapping.countryField])[0] ?? "",
    region: asStrings(record.fields[mapping.regionField])[0] ?? "",
    symbols: (asStrings(record.fields[mapping.symbolsField])[0] ?? "")
      .split(";")
      .map((symbol) => symbol.trim())
      .filter(Boolean),
    availability: Object.fromEntries(
      Object.entries(mapping.criteriaByField)
        .map(([field, criterion]) => [
          criterion,
          asStrings(record.fields[field]).filter(isMonth),
        ])
        .filter(([, months]) => months.length > 0)
    ),
  }))

  return {
    criteria: Object.values(mapping.criteriaByField),
    places,
  }
}
