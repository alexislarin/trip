import { readFile, rename, writeFile } from "node:fs/promises"
import { basename, dirname, join } from "node:path"

import { PexelsApiError, fetchFromPexels, requirePexelsApiKey } from "./pexels-client.mjs"
import { CRITERION_SEARCH_TERMS, MONTH_SEARCH_TERMS } from "./pexels-image-config.mjs"

const PLACES_DATASET_PATH = "src/data/places.generated.ts"
const OUTPUT_PATH = "src/data/ui-filter-images.generated.ts"

function parseJsonExport(source, filePath, exportName) {
  const match = source.match(
    new RegExp(
      `export const ${exportName}(?::[^=]+)? = (\\{[\\s\\S]*\\})(?: as const)?\\s*$`
    )
  )

  if (!match) throw new Error(`Could not read ${exportName} from ${filePath}`)
  return JSON.parse(match[1])
}

async function readCriteria() {
  const source = await readFile(PLACES_DATASET_PATH, "utf8")
  return parseJsonExport(source, PLACES_DATASET_PATH, "placesDataset").criteria
}

async function readExistingImages() {
  try {
    const source = await readFile(OUTPUT_PATH, "utf8")
    return parseJsonExport(source, OUTPUT_PATH, "uiFilterImages")
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return { criteria: {}, months: {} }
    }
    throw error
  }
}

function requiredEntries(criteria) {
  const criterionEntries = criteria.map((criterion) => {
    const query = CRITERION_SEARCH_TERMS[criterion]
    if (!query) throw new Error(`Missing Pexels search term for criterion: ${criterion}`)
    return { group: "criteria", key: criterion, query }
  })

  const monthEntries = Object.entries(MONTH_SEARCH_TERMS).map(([month, query]) => ({
    group: "months",
    key: month,
    query,
  }))

  return [...criterionEntries, ...monthEntries]
}

function imageExists(images, entry) {
  return typeof images[entry.group]?.[entry.key] === "string" && images[entry.group][entry.key].length > 0
}

function keepOnlyRequiredImages(existingImages, entries) {
  const images = { criteria: {}, months: {} }

  for (const entry of entries) {
    if (imageExists(existingImages, entry)) {
      images[entry.group][entry.key] = existingImages[entry.group][entry.key]
    }
  }

  return images
}

function generatedSource(images) {
  return `export const uiFilterImages = ${JSON.stringify(images, null, 2)} as const\n`
}

async function writeImagesAtomically(images) {
  const outputDirectory = dirname(OUTPUT_PATH)
  const temporaryPath = join(
    outputDirectory,
    `.${basename(OUTPUT_PATH)}.${process.pid}.${Date.now()}.tmp`
  )

  await writeFile(temporaryPath, generatedSource(images))
  await rename(temporaryPath, OUTPUT_PATH)
}

async function searchPexels(query) {
  const parameters = new URLSearchParams({
    query,
    orientation: "landscape",
    per_page: "1",
  })
  const response = await fetchFromPexels(`/v1/search?${parameters}`)
  const payload = await response.json()

  return {
    imageUrl: payload.photos?.[0]?.src?.medium,
    rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
  }
}

requirePexelsApiKey()

const entries = requiredEntries(await readCriteria())
const existingImages = await readExistingImages()
const images = keepOnlyRequiredImages(existingImages, entries)

if (JSON.stringify(images) !== JSON.stringify(existingImages)) {
  await writeImagesAtomically(images)
}

let alreadyExisted = 0
let added = 0
let apiRequests = 0
let rateLimitReached = false
let fatalRequestError
const missing = []

for (const entry of entries) {
  const label = `${entry.group === "criteria" ? "criterion" : "month"}: ${entry.key}`

  if (imageExists(images, entry)) {
    alreadyExisted += 1
    console.log(`SKIP ${label} (already exists)`)
    continue
  }

  try {
    apiRequests += 1
    const { imageUrl, rateLimitRemaining } = await searchPexels(entry.query)

    if (!imageUrl) {
      missing.push({ entry, reason: "Pexels returned 0 results or no src.medium" })
      console.error(`MISSING ${label} — query: ${entry.query}`)
      continue
    }

    images[entry.group][entry.key] = imageUrl
    await writeImagesAtomically(images)
    added += 1
    const quota = rateLimitRemaining ? ` (quota: ${rateLimitRemaining})` : ""
    console.log(`✓ ${label}${quota}`)
  } catch (error) {
    if (error instanceof PexelsApiError && error.status === 429) {
      rateLimitReached = true
      console.error("Pexels rate limit reached; saved progress before stopping.")
      break
    }

    fatalRequestError = error instanceof Error ? error.message : String(error)
    console.error(`Pexels request failed for ${label} — ${fatalRequestError}`)
    break
  }
}

const remaining = entries.length - alreadyExisted - added
console.log("\nUI filter image generation summary")
console.log(`Required: ${entries.length}`)
console.log(`Already existed: ${alreadyExisted}`)
console.log(`Added: ${added}`)
console.log(`Missing: ${missing.length}`)
console.log(`API requests: ${apiRequests}`)

if (rateLimitReached) {
  console.error(`Remaining: ${remaining}`)
  console.error("Run pnpm images:generate-ui later; it will continue with the remaining images.")
  process.exitCode = 1
} else if (fatalRequestError) {
  console.error("Generator stopped after an API error; saved progress will be reused.")
  process.exitCode = 1
} else if (missing.length > 0) {
  console.error("\nImages that still need attention:")
  for (const { entry, reason } of missing) {
    console.error(`- ${entry.group}: ${entry.key} — query: ${entry.query} — ${reason}`)
  }
  process.exitCode = 1
}
