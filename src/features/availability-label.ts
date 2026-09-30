import { MONTHS, type Month } from "@/data/model"

export function formatAvailability(months: readonly Month[]) {
  const available = new Set(months)

  if (available.size === MONTHS.length) {
    return "all year round"
  }

  const ranges = MONTHS.flatMap((month, index) => {
    const previous = MONTHS[(index - 1 + MONTHS.length) % MONTHS.length]
    if (!available.has(month) || available.has(previous)) {
      return []
    }

    let end = index
    while (available.has(MONTHS[(end + 1) % MONTHS.length])) {
      end = (end + 1) % MONTHS.length
    }

    return [end === index ? month : `${month}–${MONTHS[end]}`]
  })

  return ranges.join(", ")
}
