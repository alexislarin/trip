import { execFile } from "node:child_process"
import { writeFile } from "node:fs/promises"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const BASE_NAME = "Fancy a Trip?"
const FIRST_CRITERION_NAME = "Beach"
const TRAVEL_SAFETY_FIELD_NAME = "Travel Safety"
const EXCLUDED_TRAVEL_SAFETY_VALUES = new Set(["Reconsider", "Do not travel"])
// Explicit user-provided Symbols that have not yet been reflected in Airtable.
// Keep these by record ID so a later sync cannot detach their selected photos.
const SYMBOL_OVERRIDES = new Map([
  ["recJk525f8K54OxS1", { previous: ["Trafalgar Falls", "Emerald Pool"], current: ["coastal cliffs"] }],
  ["recYKHBhCWoov48ET", { previous: ["Port Vila", "blue holes"], current: ["tropical islands"] }],
  ["recZU9zTLgyEF4g3s", { previous: ["Moroni mosque"], current: ["island coastline"] }],
  ["recgFqOofBi8AG4sd", { previous: ["Malabo"], current: ["Bioko Island"] }],
  ["recq6yL3lCmTLrceU", { previous: ["Sibebe Rock"], current: ["Manzini countryside"] }],
])
const MONTHS = new Set([
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
])

async function callAirtable(tool, args) {
  const { stdout } = await execFileAsync("airtable-mcp", [tool, ...args], {
    maxBuffer: 20 * 1024 * 1024,
  })
  return JSON.parse(stdout)
}

function namesFromCell(cell) {
  return Array.isArray(cell)
    ? cell.map((option) => option.name).filter((name) => MONTHS.has(name))
    : []
}

function selectNameFromCell(cell) {
  return cell && typeof cell === "object" && "name" in cell ? cell.name : ""
}

const baseSearch = await callAirtable("search-bases", [
  "--searchQuery",
  BASE_NAME,
])
const base = baseSearch.bases.find((candidate) => candidate.name === BASE_NAME)

if (!base) {
  throw new Error(`Airtable base not found: ${BASE_NAME}`)
}

const { tables } = await callAirtable("list-tables-for-base", [
  "--baseId",
  base.id,
  "--refresh",
])

if (tables.length !== 1) {
  throw new Error("Expected exactly one table in Fancy a Trip?")
}

const [table] = tables
const firstCriterionIndex = table.fields.findIndex(
  (field) => field.name === FIRST_CRITERION_NAME
)

if (firstCriterionIndex === -1) {
  throw new Error(`Criterion field not found: ${FIRST_CRITERION_NAME}`)
}

const countryField = table.fields.find((field) => field.name === "Country")
const regionField = table.fields.find((field) => field.name === "Region")
const symbolsField = table.fields.find((field) => field.name === "Symbols")
const travelSafetyField = table.fields.find(
  (field) => field.name === TRAVEL_SAFETY_FIELD_NAME
)

if (!countryField || !regionField || !symbolsField || !travelSafetyField) {
  throw new Error("Country, Region, Symbols, and Travel safety fields are required")
}

const criteriaFields = table.fields
  .slice(firstCriterionIndex)
  .filter((field) => field.type === "multipleSelects")
const schema = await callAirtable("get-table-schema", [
  "--baseId",
  base.id,
  "--tables",
  JSON.stringify([{ tableId: table.id }]),
])
const travelSafetySchema = schema.tables[0]?.fields.find(
  (field) => field.id === travelSafetyField.id
)
const excludedTravelSafetyChoiceIds = travelSafetySchema?.config?.choices
  ?.filter((choice) => EXCLUDED_TRAVEL_SAFETY_VALUES.has(choice.name))
  .map((choice) => choice.id)

if (excludedTravelSafetyChoiceIds?.length !== EXCLUDED_TRAVEL_SAFETY_VALUES.size) {
  throw new Error("Required Travel safety choices are missing")
}

const travelSafetyFilter = {
  operands: [
    {
      operator: "isNoneOf",
      operands: [travelSafetyField.id, excludedTravelSafetyChoiceIds],
    },
  ],
}
const records = []
let cursor

do {
  const args = [
    "--baseId",
    base.id,
    "--tableId",
    table.id,
    "--fieldIds",
    JSON.stringify(table.fields.map((field) => field.id)),
    "--pageSize",
    "100",
    "--filters",
    JSON.stringify(travelSafetyFilter),
  ]

  if (cursor) args.push("--cursor", cursor)

  const page = await callAirtable("list-records-for-table", args)
  records.push(...page.records)
  cursor = page.nextCursor
} while (cursor)

const dataset = {
  criteria: criteriaFields
    .map((field) => field.name)
    .toSorted((first, second) => first.localeCompare(second)),
  places: records
    .filter(
      (record) =>
        !EXCLUDED_TRAVEL_SAFETY_VALUES.has(
          selectNameFromCell(record.cellValuesByFieldId[travelSafetyField.id])
        )
    )
    .map((record) => {
      const availability = Object.fromEntries(
        criteriaFields.flatMap((field) => {
          const months = namesFromCell(record.cellValuesByFieldId[field.id])
          return months.length > 0 ? [[field.name, months]] : []
        })
      )

      const sourceSymbols = (record.cellValuesByFieldId[symbolsField.id] ?? "")
        .split(";")
        .map((symbol) => symbol.trim())
        .filter(Boolean)
      const override = SYMBOL_OVERRIDES.get(record.id)
      if (
        override &&
        ![override.previous, override.current].some(
          (symbols) => JSON.stringify(symbols) === JSON.stringify(sourceSymbols)
        )
      ) {
        throw new Error(`Symbols override needs review for ${record.id}`)
      }

      return {
        id: record.id,
        country: record.cellValuesByFieldId[countryField.id] ?? "",
        region: record.cellValuesByFieldId[regionField.id] ?? "",
        symbols: override?.current ?? sourceSymbols,
        availability,
      }
    }),
}

const output = `import type { PlacesDataset } from "@/data/model"\n\nexport const placesDataset: PlacesDataset = ${JSON.stringify(dataset, null, 2)}\n`

await writeFile("src/data/places.generated.ts", output)
console.log(
  `Imported ${dataset.places.length} eligible places from ${BASE_NAME}.`
)
