const PEXELS_API_ORIGIN = "https://api.pexels.com"

export class PexelsApiError extends Error {
  constructor(response) {
    super(`Pexels API request failed: ${response.status} ${response.statusText}`)
    this.name = "PexelsApiError"
    this.status = response.status
    this.headers = response.headers
  }
}

export function requirePexelsApiKey() {
  const apiKey = process.env.PEXELS_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      "PEXELS_API_KEY is required. Set it in your local environment before running a Pexels build-time script."
    )
  }

  return apiKey
}

function pexelsUrl(path) {
  const url = new URL(path, PEXELS_API_ORIGIN)

  if (url.origin !== PEXELS_API_ORIGIN) {
    throw new Error("Pexels requests must target https://api.pexels.com")
  }

  return url
}

/**
 * Make authenticated Pexels API requests from local/build-time Node.js scripts.
 * Never import this module from browser code.
 */
export async function fetchFromPexels(path, options = {}) {
  const headers = new Headers(options.headers)
  headers.set("Authorization", requirePexelsApiKey())

  const response = await fetch(pexelsUrl(path), {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new PexelsApiError(response)
  }

  return response
}
