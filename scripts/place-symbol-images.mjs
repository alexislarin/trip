import { readFile, writeFile, mkdir, rename } from "node:fs/promises"
import { join } from "node:path"
import { fetchFromPexels, PexelsApiError } from "./pexels-client.mjs"

const PLACES_FILE = "src/data/places.generated.ts"
const IMAGES_FILE = "src/data/place-symbol-images.generated.ts"
const CACHE_DIR = ".image-candidates"
const IMAGE_PREFIX =
  "export const placeSymbolImages: Readonly<Record<string, Readonly<Record<string, string>>>> = "

function parseGenerated(source) {
  return JSON.parse(source.slice(source.indexOf(" = ") + 3).trim())
}

async function readPlaces() {
  return parseGenerated(await readFile(PLACES_FILE, "utf8")).places
}

async function readImages() {
  try {
    return parseGenerated(await readFile(IMAGES_FILE, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") return {}
    throw error
  }
}

async function saveImages(images) {
  const next = Object.fromEntries(
    Object.entries(images)
      .filter(([, selected]) => Object.keys(selected).length)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, selected]) => [id, selected])
  )
  const temporary = `${IMAGES_FILE}.tmp`
  await writeFile(temporary, `${IMAGE_PREFIX}${JSON.stringify(next, null, 2)}\n`)
  await rename(temporary, IMAGES_FILE)
}

function reconcile(places, images) {
  const byId = new Map(places.map((place) => [place.id, place]))
  const result = {}
  for (const [id, selected] of Object.entries(images)) {
    const place = byId.get(id)
    if (!place) continue
    const retained = Object.fromEntries(
      place.symbols
        .filter((symbol) => typeof selected[symbol] === "string" && selected[symbol])
        .map((symbol) => [symbol, selected[symbol]])
    )
    if (Object.keys(retained).length) result[id] = retained
  }
  return result
}

function photoId(url) {
  const match = url.match(/(?:\/photos\/|pexels-photo-)(\d+)/)
  return match?.[1] ?? null
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character])
}

function queriesFor(place, symbol, explicit) {
  if (explicit.length) {
    if (explicit.length < 2 || explicit.length > 3) {
      throw new Error("Provide two or three --query values.")
    }
    return explicit
  }
  const name = place.region || place.country
  const geography = [place.region, place.country].filter(Boolean).join(" ")
  return [...new Set([
    `${name} ${symbol}`,
    `${symbol} ${geography}`,
    place.region && place.country
      ? `${place.country} ${symbol} ${place.region}`
      : `${symbol} in ${name}`,
  ])].slice(0, 3)
}

async function search(query, page) {
  const params = new URLSearchParams({
    query, orientation: "landscape", per_page: "10", page: String(page),
  })
  for (let attempt = 0; attempt < 4; attempt++) {
    // Keep editorial batches below Pexels' burst limit, including retries.
    const wait = Math.max(0, 1300 - (Date.now() - (search.lastRequestAt ?? 0)))
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait))
    search.lastRequestAt = Date.now()
    try {
      const response = await fetchFromPexels(`/v1/search?${params}`, {
        signal: AbortSignal.timeout(15000),
      })
      return (await response.json()).photos ?? []
    } catch (error) {
      if (!(error instanceof PexelsApiError) || error.status !== 429 || attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, [5000, 15000, 30000][attempt]))
    }
  }
}

async function prepare(places, images, args) {
  const [id, symbol, ...rest] = args
  const place = places.find((entry) => entry.id === id)
  if (!place || !place.symbols.includes(symbol)) {
    throw new Error("Use a current place ID and one of its exact Symbols.")
  }
  if (images[id]?.[symbol] && !rest.includes("--force")) {
    console.log("Already selected; use --force only to inspect again.")
    return
  }
  const explicit = []
  let firstPage = 1
  for (let index = 0; index < rest.length; index++) {
    if (rest[index] === "--query") explicit.push(rest[++index])
    if (rest[index] === "--page") firstPage = Number(rest[++index])
  }
  if (!Number.isInteger(firstPage) || firstPage < 1 || firstPage > 10) {
    throw new Error("--page must be an integer from 1 to 10.")
  }
  const queries = queriesFor(place, symbol, explicit)
  const candidates = new Map()
  for (const query of queries) {
    for (const photo of await search(query, firstPage)) {
      if (photo.width > photo.height && photo.src?.large && photo.src?.medium) {
        candidates.set(String(photo.id), {
          id: String(photo.id), width: photo.width, height: photo.height,
          alt: photo.alt ?? "", pageUrl: photo.url ?? "",
          imageUrl: photo.src.large, previewUrl: photo.src.medium,
          foundBy: [...new Set([...(candidates.get(String(photo.id))?.foundBy ?? []), query])],
        })
      }
    }
  }
  // Search the next page when query overlap leaves too little choice.
  for (const query of queries) {
    if (candidates.size >= 15) break
    for (const photo of await search(query, firstPage + 1)) {
      if (photo.width > photo.height && photo.src?.large && photo.src?.medium) {
        candidates.set(String(photo.id), {
          id: String(photo.id), width: photo.width, height: photo.height,
          alt: photo.alt ?? "", pageUrl: photo.url ?? "",
          imageUrl: photo.src.large, previewUrl: photo.src.medium,
          foundBy: [...new Set([...(candidates.get(String(photo.id))?.foundBy ?? []), query])],
        })
      }
    }
  }
  const usedIds = new Set(Object.values(images).flatMap((selected) =>
    Object.values(selected).map(photoId).filter(Boolean)
  ))
  const available = [...candidates.values()]
    .filter((photo) => !usedIds.has(photo.id))
    .slice(0, 30)
  const directory = join(CACHE_DIR, id, slug(symbol))
  await mkdir(directory, { recursive: true })
  const downloaded = []
  for (let index = 0; index < available.length; index += 5) {
    const group = await Promise.all(available.slice(index, index + 5).map(async (photo) => {
      try {
        const response = await fetch(photo.previewUrl, {
          signal: AbortSignal.timeout(15000),
        })
        if (!response.ok) return null
        const file = `${photo.id}.jpg`
        await writeFile(join(directory, file), Buffer.from(await response.arrayBuffer()))
        return { ...photo, file }
      } catch {
        return null
      }
    }))
    downloaded.push(...group.filter(Boolean))
  }
  await writeFile(join(directory, "candidates.json"), JSON.stringify({
    place: [place.country, place.region].filter(Boolean).join(" / "),
    symbol, queries, candidates: downloaded,
  }, null, 2))
  const cards = downloaded.map((photo) => `<figure><img src="${photo.file}"><figcaption><b>${photo.id}</b> · ${photo.width}×${photo.height}<br>${escapeHtml(photo.alt)}<br><a href="${escapeHtml(photo.pageUrl)}">Pexels page</a><br>${escapeHtml(photo.foundBy.join(" | "))}</figcaption></figure>`).join("\n")
  const html = `<!doctype html><meta charset="utf-8"><title>${escapeHtml(place.country || place.region)} — ${escapeHtml(symbol)}</title><style>body{font:14px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}figure{margin:0;border:1px solid #ddd}img{width:100%;aspect-ratio:3/2;object-fit:contain;background:#eee}figcaption{padding:8px;overflow-wrap:anywhere}</style><h1>${escapeHtml([place.country,place.region].filter(Boolean).join(" / "))}: ${escapeHtml(symbol)}</h1><main>${cards}</main>`
  await writeFile(join(directory, "index.html"), html)
  console.log(`${downloaded.length} candidates from ${queries.length} queries: ${join(directory, "index.html")}`)
}

async function select(places, images, args) {
  const [id, symbol, idOfPhoto, location, visible] = args
  const place = places.find((entry) => entry.id === id)
  if (!place?.symbols.includes(symbol)) throw new Error("Unknown place or Symbol.")
  if (!["verified", "compatible"].includes(location) || visible !== "symbol-visible") {
    throw new Error("Usage: select PLACE_ID SYMBOL PHOTO_ID verified|compatible symbol-visible")
  }
  const directory = join(CACHE_DIR, id, slug(symbol))
  const batch = JSON.parse(await readFile(join(directory, "candidates.json"), "utf8"))
  const candidate = batch.candidates.find((photo) => photo.id === idOfPhoto)
  if (!candidate) throw new Error("Photo ID is not in the reviewed candidate batch.")
  if (candidate.width <= candidate.height) throw new Error("Photo is not landscape.")
  for (const [otherId, selected] of Object.entries(images)) {
    for (const [otherSymbol, url] of Object.entries(selected)) {
      if (photoId(url) === idOfPhoto && (otherId !== id || otherSymbol !== symbol)) {
        throw new Error(`Photo already selected for ${otherId} / ${otherSymbol}.`)
      }
    }
  }
  images[id] ??= {}
  images[id][symbol] = candidate.imageUrl
  await saveImages(reconcile(places, images))
  console.log(`Selected ${id} / ${symbol}: ${candidate.imageUrl}`)
}

async function validate(places, images) {
  const current = reconcile(places, images)
  await saveImages(current)
  const seen = new Map()
  const unresolved = []
  let selected = 0
  for (const place of places) {
    for (const symbol of place.symbols) {
      const url = current[place.id]?.[symbol]
      if (!url) {
        unresolved.push(`${[place.country, place.region].filter(Boolean).join(" / ")} — ${symbol}`)
        continue
      }
      if (!url.startsWith("https://images.pexels.com/")) throw new Error(`Invalid URL: ${url}`)
      const id = photoId(url)
      if (!id) throw new Error(`Cannot identify Pexels photo: ${url}`)
      if (seen.has(id)) throw new Error(`Duplicate photo ${id}: ${seen.get(id)} and ${place.id} / ${symbol}`)
      seen.set(id, `${place.id} / ${symbol}`)
      selected++
    }
  }
  console.log(`Places: ${places.length}; Symbols: ${selected + unresolved.length}; selected: ${selected}; unresolved: ${unresolved.length}`)
  for (const pair of unresolved) console.log(`UNRESOLVED ${pair}`)
}

const [command, ...args] = process.argv.slice(2)
try {
  const places = await readPlaces()
  const images = await readImages()
  if (command === "prepare") await prepare(places, images, args)
  else if (command === "select") await select(places, images, args)
  else if (command === "validate") await validate(places, images)
  else throw new Error("Use prepare, select, or validate.")
} catch (error) {
  if (error instanceof PexelsApiError && error.status === 429) {
    console.error(`Pexels rate limit reached. Reset: ${error.headers.get("x-ratelimit-reset") ?? "unknown"}; retry-after: ${error.headers.get("retry-after") ?? "unknown"}. Existing selections are preserved.`)
  }
  console.error(error.message)
  process.exitCode = 1
}
