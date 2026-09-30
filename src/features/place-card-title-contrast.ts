import { useLayoutEffect, type RefObject } from "react"

// Place-card behavior: keep the image analysis and its tuning local to this feature.
// The title starts white in .place-card-title until its photos can be sampled.
// 0 always chooses white; increasing this value makes dark titles more common.
const PLACE_CARD_DARK_TEXT_WEIGHT = 0.7
const MAX_CONTRAST_SCORE = 7
const MAX_SAMPLE_WIDTH = 256
const MAX_SAMPLE_HEIGHT = 128
const MAX_CACHE_ENTRIES = 500

type TitleTone = "light" | "dark"

const contrastCache = new Map<string, TitleTone>()

function rounded(value: number) {
  return Math.round(value * 10) / 10
}

function relativeRect(rect: DOMRect, origin: Pick<DOMRect, "left" | "top">) {
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  }
}

type Rect = ReturnType<typeof relativeRect>

function intersection(first: Rect, second: Rect): Rect | null {
  const left = Math.max(first.x, second.x)
  const top = Math.max(first.y, second.y)
  const right = Math.min(first.x + first.width, second.x + second.width)
  const bottom = Math.min(first.y + first.height, second.y + second.height)

  return right > left && bottom > top
    ? { x: left, y: top, width: right - left, height: bottom - top }
    : null
}

function linearChannel(value: number) {
  const channel = value / 255
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

function chooseTextTone(
  pixels: Uint8ClampedArray,
  width: number,
  lineRects: Rect[],
  scale: number,
) {
  let lightScore = 0
  let darkScore = 0

  for (let index = 0; index < pixels.length; index += 4) {
    const pixel = index / 4
    const x = ((pixel % width) + 0.5) / scale
    const y = (Math.floor(pixel / width) + 0.5) / scale
    if (
      !lineRects.some(
        (rect) =>
          x >= rect.x &&
          x < rect.x + rect.width &&
          y >= rect.y &&
          y < rect.y + rect.height,
      )
    ) {
      continue
    }

    const luminance =
      0.2126 * linearChannel(pixels[index]) +
      0.7152 * linearChannel(pixels[index + 1]) +
      0.0722 * linearChannel(pixels[index + 2])
    const lightContrast = 1.05 / (luminance + 0.05)
    const darkContrast = (luminance + 0.05) / 0.05

    lightScore += Math.min(lightContrast, MAX_CONTRAST_SCORE)
    darkScore += Math.min(darkContrast, MAX_CONTRAST_SCORE)
  }

  return darkScore * PLACE_CARD_DARK_TEXT_WEIGHT > lightScore
    ? "dark"
    : "light"
}

function measureAndChoose(
  title: HTMLElement,
  photos: HTMLElement | null,
  images: HTMLImageElement[],
) {
  const range = document.createRange()
  range.selectNodeContents(title)
  const renderedLines = Array.from(range.getClientRects()).filter(
    (rect) => rect.width > 0 && rect.height > 0,
  )
  const titleBounds = renderedLines.length
    ? {
        left: Math.min(...renderedLines.map((rect) => rect.left)),
        top: Math.min(...renderedLines.map((rect) => rect.top)),
        width:
          Math.max(...renderedLines.map((rect) => rect.right)) -
          Math.min(...renderedLines.map((rect) => rect.left)),
        height:
          Math.max(...renderedLines.map((rect) => rect.bottom)) -
          Math.min(...renderedLines.map((rect) => rect.top)),
      }
    : title.getBoundingClientRect()
  if (titleBounds.width <= 0 || titleBounds.height <= 0) return null
  if (images.some((image) => !image.complete)) return null

  const titleRect: Rect = {
    x: 0,
    y: 0,
    width: titleBounds.width,
    height: titleBounds.height,
  }
  const photosRect = photos
    ? relativeRect(photos.getBoundingClientRect(), titleBounds)
    : null
  const lineRects = renderedLines.length
    ? renderedLines.map((rect) => relativeRect(rect, titleBounds))
    : [titleRect]
  const imageRects = images.map((image) =>
    relativeRect(image.getBoundingClientRect(), titleBounds),
  )
  const key = JSON.stringify({
    preference: PLACE_CARD_DARK_TEXT_WEIGHT,
    title: [rounded(titleRect.width), rounded(titleRect.height)],
    lines: lineRects.map((rect) => Object.values(rect).map(rounded)),
    photos: photosRect && Object.values(photosRect).map(rounded),
    images: images.map((image, index) => [
      image.currentSrc || image.src,
      image.naturalWidth,
      image.naturalHeight,
      ...Object.values(imageRects[index]).map(rounded),
    ]),
  })
  const cached = contrastCache.get(key)
  if (cached) return { key, tone: cached }

  const scale = Math.min(
    1,
    MAX_SAMPLE_WIDTH / titleRect.width,
    MAX_SAMPLE_HEIGHT / titleRect.height,
  )
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.ceil(titleRect.width * scale))
  canvas.height = Math.max(1, Math.ceil(titleRect.height * scale))
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null

  // The card is black wherever a photo has not loaded or does not cover the title.
  const card = title.closest<HTMLElement>(".place-card")
  context.fillStyle = card
    ? getComputedStyle(card).backgroundColor
    : getComputedStyle(title).getPropertyValue("--sidebar").trim()
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (photosRect) {
    images.forEach((image, index) => {
      if (!image.naturalWidth || !image.naturalHeight) return

      const imageRect = imageRects[index]
      const visible = intersection(
        titleRect,
        intersection(photosRect, imageRect) ?? {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
      )
      if (!visible) return

      // CSS uses object-fit: cover with the default centered object position.
      const coverScale = Math.max(
        imageRect.width / image.naturalWidth,
        imageRect.height / image.naturalHeight,
      )
      const croppedWidth = imageRect.width / coverScale
      const croppedHeight = imageRect.height / coverScale
      const cropX = (image.naturalWidth - croppedWidth) / 2
      const cropY = (image.naturalHeight - croppedHeight) / 2

      context.drawImage(
        image,
        cropX + (visible.x - imageRect.x) / coverScale,
        cropY + (visible.y - imageRect.y) / coverScale,
        visible.width / coverScale,
        visible.height / coverScale,
        visible.x * scale,
        visible.y * scale,
        visible.width * scale,
        visible.height * scale,
      )
    })
  }

  try {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const tone = chooseTextTone(pixels, canvas.width, lineRects, scale)
    contrastCache.set(key, tone)
    if (contrastCache.size > MAX_CACHE_ENTRIES) {
      contrastCache.delete(contrastCache.keys().next().value!)
    }
    return { key, tone }
  } catch {
    // A CDN without canvas CORS access cannot be sampled; keep the CSS fallback.
    return { key, tone: "light" as const }
  }
}

export function usePlaceCardTitleContrast(
  cardRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const card = cardRef.current
    const title = titleRef.current
    if (!card || !title) return

    const photos = card.querySelector<HTMLElement>(".place-card-photos")
    const images = Array.from(photos?.querySelectorAll("img") ?? [])
    let frame = 0
    let lastKey = ""
    let disposed = false

    function update() {
      frame = 0
      if (!title) return
      const result = measureAndChoose(title, photos, images)
      if (!result || result.key === lastKey) return
      lastKey = result.key
      title.dataset.contrastTone = result.tone
    }

    function schedule() {
      if (!frame && !disposed) frame = requestAnimationFrame(update)
    }

    const observer = new ResizeObserver(schedule)
    observer.observe(card)
    observer.observe(title)
    if (photos) observer.observe(photos)
    images.forEach((image) => {
      observer.observe(image)
      image.addEventListener("load", schedule)
      image.addEventListener("error", schedule)
    })
    window.addEventListener("resize", schedule)
    document.fonts.ready.then(schedule)
    schedule()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      images.forEach((image) => {
        image.removeEventListener("load", schedule)
        image.removeEventListener("error", schedule)
      })
      window.removeEventListener("resize", schedule)
    }
  }, [cardRef, titleRef])
}
