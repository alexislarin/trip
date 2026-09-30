import type { Month, Place } from "@/data/places"

const displayedPlaceName = (place: Place) => place.country || place.region

export function filterPlaces(
  places: readonly Place[],
  selectedCriteria: readonly string[],
  selectedMonth: Month | undefined
) {
  return places
    .filter((place) => {
      if (Object.keys(place.availability).length === 0) return false

      const hasAvailability = (criterion: string) => {
        const months = place.availability[criterion]
        return months && (!selectedMonth || months.includes(selectedMonth))
      }

      return selectedCriteria.length > 0
        ? selectedCriteria.every(hasAvailability)
        : !selectedMonth ||
            Object.keys(place.availability).some(hasAvailability)
    })
    .toSorted(
      (first, second) =>
        displayedPlaceName(first).localeCompare(displayedPlaceName(second)) ||
        first.region.localeCompare(second.region)
    )
}
