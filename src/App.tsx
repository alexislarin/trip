import {
  type CSSProperties,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { motion } from "motion/react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MONTHS, placesDataset, type Month, type Place } from "@/data/places"
import { placeSymbolImages } from "@/data/place-symbol-images.generated"
import { uiFilterImages } from "@/data/ui-filter-images.generated"
import { formatAvailability } from "@/features/availability-label"
import { filterPlaces } from "@/features/place-filters"
import { usePlaceCardTitleContrast } from "@/features/place-card-title-contrast"
import { cn } from "@/lib/utils"

const MONTH_COLUMNS = 3
const MINIMUM_CARD_WIDTH_REM = 20.5
const LARGE_SCREEN_MINIMUM_CARD_WIDTH_REM = 25
const LARGE_SCREEN_BREAKPOINT = 1440
const monthRows = Array.from(
  { length: Math.ceil(MONTHS.length / MONTH_COLUMNS) },
  (_, index) => MONTHS.slice(index * MONTH_COLUMNS, (index + 1) * MONTH_COLUMNS)
)

function filterImageStyle(group: "criteria" | "months", value: string) {
  const images = uiFilterImages[group] as Readonly<Record<string, string>>
  const imageUrl = images[value]

  return imageUrl
    ? ({
        "--toggle-image": `url("${imageUrl}")`,
        "--toggle-overlay-color": "var(--sidebar)",
      } as CSSProperties)
    : undefined
}

function uncroppedPhotoUrl(url: string) {
  const photoUrl = new URL(url)
  photoUrl.searchParams.delete("h")
  return photoUrl.toString()
}

function gridAnchor(index: number, columns: number) {
  return {
    column: Math.max(1, index % columns),
    row: Math.floor(index / columns) + 1,
  }
}

function gridTrackAt(position: number, tracks: string, gap: number) {
  const sizes = tracks.split(" ").map(Number.parseFloat)
  if (sizes.some((size) => !Number.isFinite(size))) return 1

  let start = 0
  let closest = 1
  let distance = Number.POSITIVE_INFINITY

  sizes.forEach((size, index) => {
    const nextDistance = Math.abs(position - start)
    if (nextDistance < distance) {
      closest = index + 1
      distance = nextDistance
    }
    start += size + gap
  })

  return closest
}

function currentGridCell(grid: HTMLElement, card: HTMLElement) {
  const style = getComputedStyle(grid)
  return {
    column: gridTrackAt(
      card.offsetLeft,
      style.gridTemplateColumns,
      Number.parseFloat(style.columnGap) || 0
    ),
    row: gridTrackAt(
      card.offsetTop,
      style.gridTemplateRows,
      Number.parseFloat(style.rowGap) || 0
    ),
  }
}

function centerExpandedCardOnMobile(card: HTMLButtonElement) {
  if (!window.matchMedia("(max-width: 640px)").matches) return

  const centerCard = () => {
    card.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      centerCard()
    })
  })
  window.setTimeout(centerCard, 300)
}

type SelectedCard = {
  id: string
  index: number
  columns: number
  column: number
  row: number
}

const MotionSidebarInset = motion.create(SidebarInset)

function PlaceCard({
  place,
  selected,
  multiColumn,
  placement,
  onSelect,
}: {
  place: Place
  selected: boolean
  multiColumn: boolean
  placement?: CSSProperties
  onSelect: (card: HTMLButtonElement) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  usePlaceCardTitleContrast(cardRef, titleRef)

  const title = [place.country, place.region].filter(Boolean).join(" / ")
  const symbolImages = placeSymbolImages[place.id] ?? {}
  const photos = place.symbols.flatMap((symbol) => {
    const url = symbolImages[symbol]
    return url ? [{ symbol, url }] : []
  })
  const availability = Object.entries(place.availability)

  return (
    <motion.button
      type="button"
      layout
      style={placement}
      aria-pressed={selected}
      aria-label={`${title}: ${selected ? "collapse" : "expand"} card`}
      onClick={(event) => onSelect(event.currentTarget)}
      className={cn(
        "place-card-cell col-span-1 row-span-1 block min-w-0 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        selected && multiColumn && "col-span-2 row-span-2"
      )}
      transition={{ layout: { type: "spring", stiffness: 300, damping: 32 } }}
    >
      <Card
        ref={cardRef}
        size="sm"
        className="place-card h-full w-full"
        data-expanded={selected}
      >
        {photos.length > 0 && (
          <div
            className="place-card-photos"
            data-count={photos.length}
            data-expanded={selected}
          >
            {photos.map(({ symbol, url }) => (
              <img
                key={symbol}
                crossOrigin="anonymous"
                src={selected ? uncroppedPhotoUrl(url) : url}
                alt={symbol}
                loading="lazy"
              />
            ))}
          </div>
        )}
        <div className="place-card-details">
          <div className="place-card-main">
            <CardHeader className="place-card-header">
              <CardTitle ref={titleRef} className="place-card-title">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="place-card-tags flex flex-wrap gap-1.5">
              {place.symbols.map((symbol) => (
                <Badge key={symbol} className="place-card-tag">
                  {symbol}
                </Badge>
              ))}
            </CardContent>
          </div>
          {selected && availability.length > 0 && (
            <div className="place-card-availability">
              <div className="place-card-availability-criteria">
                {availability.map(([criterion]) => (
                  <Badge key={criterion}>{criterion}</Badge>
                ))}
              </div>
              <div className="place-card-availability-months">
                {availability.map(([criterion, months]) => (
                  <Badge key={criterion} variant="secondary">
                    {formatAvailability(months)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.button>
  )
}

export function App() {
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<Month | undefined>()
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null)
  const [gridColumns, setGridColumns] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [compactFilterSummary, setCompactFilterSummary] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const summaryLabelRef = useRef<HTMLSpanElement>(null)
  const summaryMeasureRef = useRef<HTMLSpanElement>(null)
  const sidebarContentRef = useRef<HTMLDivElement>(null)
  const filterLayoutRef = useRef<HTMLDivElement>(null)
  const criteriaContentRef = useRef<HTMLDivElement>(null)
  const monthContentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const sidebarContent = sidebarContentRef.current
    const layout = filterLayoutRef.current
    const criteriaToggle = criteriaContentRef.current?.querySelector(
      '[data-slot="toggle-group"]'
    )
    const monthGrid = monthContentRef.current

    if (!sidebarContent || !layout || !criteriaToggle || !monthGrid) return

    const content = sidebarContent
    const filterLayout = layout
    const criteriaList = criteriaToggle
    const monthsList = monthGrid

    const criteriaButtons = Array.from(
      criteriaList.querySelectorAll<HTMLElement>(
        '[data-slot="toggle-group-item"]'
      )
    )
    const monthButtons = Array.from(
      monthsList.querySelectorAll<HTMLElement>(
        '[data-slot="toggle-group-item"]'
      )
    )

    function updateRowHeight() {
      const criteriaRows = new Set(
        criteriaButtons.map((button) =>
          Math.round(button.getBoundingClientRect().top)
        )
      ).size
      const monthRowCount = monthsList.children.length
      const totalRows = criteriaRows + monthRowCount
      if (!totalRows) return

      const sidebarStyle = getComputedStyle(content)
      const availableHeight =
        content.clientHeight -
        parseFloat(sidebarStyle.paddingTop) -
        parseFloat(sidebarStyle.paddingBottom)
      const criteriaGap = parseFloat(getComputedStyle(criteriaList).rowGap) || 0
      const monthGap = parseFloat(getComputedStyle(monthsList).rowGap) || 0
      const groupGap = parseFloat(getComputedStyle(filterLayout).rowGap) || 0
      const gapHeight =
        groupGap +
        Math.max(0, criteriaRows - 1) * criteriaGap +
        Math.max(0, monthRowCount - 1) * monthGap

      const intrinsicHeight = Math.max(
        ...[...criteriaButtons, ...monthButtons].map((button) => {
          const range = document.createRange()
          range.selectNodeContents(button)
          const style = getComputedStyle(button)
          return (
            range.getBoundingClientRect().height +
            parseFloat(style.paddingTop) +
            parseFloat(style.paddingBottom) +
            parseFloat(style.borderTopWidth) +
            parseFloat(style.borderBottomWidth)
          )
        })
      )
      const rowHeight = Math.max(
        intrinsicHeight,
        (availableHeight - gapHeight) / totalRows
      )
      const rowHeightValue = `${Math.round(rowHeight * 1000) / 1000}px`
      if (
        filterLayout.style.getPropertyValue("--sidebar-filter-row-height") ===
        rowHeightValue
      ) {
        return
      }

      filterLayout.style.setProperty(
        "--sidebar-filter-row-height",
        rowHeightValue
      )
      filterLayout.style.setProperty(
        "--criteria-group-height",
        `${criteriaRows * rowHeight + Math.max(0, criteriaRows - 1) * criteriaGap}px`
      )
      filterLayout.style.setProperty(
        "--month-group-height",
        `${monthRowCount * rowHeight + Math.max(0, monthRowCount - 1) * monthGap}px`
      )
      filterLayout.style.setProperty("--month-row-count", `${monthRowCount}`)
    }

    updateRowHeight()
    const observer = new ResizeObserver(updateRowHeight)
    observer.observe(content)
    observer.observe(criteriaList)
    return () => observer.disconnect()
  }, [])

  const places = useMemo(
    () => filterPlaces(placesDataset.places, selectedCriteria, selectedMonth),
    [selectedCriteria, selectedMonth]
  )
  const hasPlaces = places.length > 0
  const fullFilterSummary = selectedCriteria.length
    ? `${selectedCriteria.join(", ")}${selectedMonth ? ` in ${selectedMonth}` : ""}`
    : (selectedMonth ?? "Select interests...")
  const shortFilterSummary = selectedCriteria.length
    ? `${selectedCriteria.length} ${selectedCriteria.length === 1 ? "criterion" : "criteria"}${selectedMonth ? ` in ${selectedMonth}` : ""}`
    : fullFilterSummary

  useLayoutEffect(() => {
    const label = summaryLabelRef.current
    const measure = summaryMeasureRef.current
    if (!label || !measure) return

    const updateSummary = () => {
      setCompactFilterSummary(
        measure.getBoundingClientRect().width > label.clientWidth
      )
    }

    updateSummary()
    const observer = new ResizeObserver(updateSummary)
    observer.observe(label)
    return () => observer.disconnect()
  }, [fullFilterSummary])

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const updateColumns = () => {
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 0
      const minimumCardWidthRem =
        window.innerWidth >= LARGE_SCREEN_BREAKPOINT
          ? LARGE_SCREEN_MINIMUM_CARD_WIDTH_REM
          : MINIMUM_CARD_WIDTH_REM
      const minimumCardWidth =
        minimumCardWidthRem *
        parseFloat(getComputedStyle(document.documentElement).fontSize)
      setGridColumns(
        Math.max(
          1,
          Math.floor((grid.clientWidth + gap) / (minimumCardWidth + gap))
        )
      )
    }

    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [hasPlaces])

  return (
    <SidebarProvider
      className="place-page h-svh overflow-hidden"
      style={{ "--sidebar-width": "min(20vw, 25rem)" } as CSSProperties}
    >
      <div className="place-filter-shell">
        <Button
          type="button"
          variant="link"
          size="lg"
          className="place-filter-topbar hidden h-auto w-full shrink-0 border-0 bg-sidebar py-5 text-sidebar-foreground"
          aria-expanded={mobileFiltersOpen}
          aria-controls="place-filter-panel"
          onClick={() => setMobileFiltersOpen((open) => !open)}
        >
          <span
            ref={summaryLabelRef}
            className="relative min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {compactFilterSummary ? shortFilterSummary : fullFilterSummary}
            <span
              ref={summaryMeasureRef}
              aria-hidden="true"
              className="pointer-events-none invisible absolute left-0 whitespace-nowrap"
            >
              {fullFilterSummary}
            </span>
          </span>
          {mobileFiltersOpen ? (
            <ChevronUp aria-hidden="true" className="size-4 shrink-0" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          )}
        </Button>
        <Sidebar
          id="place-filter-panel"
          collapsible="none"
          data-mobile-open={mobileFiltersOpen}
          className="place-filter-panel h-svh shrink-0"
        >
          <SidebarContent ref={sidebarContentRef} className="p-3 pb-0 md:p-4 md:pb-0">
            <div
              ref={filterLayoutRef}
              className="place-filter-layout flex h-full min-h-0 flex-col gap-8"
            >
              <SidebarGroup className="place-filter-group place-criteria-group shrink-0 p-0">
                <SidebarGroupContent
                  ref={criteriaContentRef}
                  className="h-full"
                >
                  <ToggleGroup
                    multiple
                    value={selectedCriteria}
                    onValueChange={setSelectedCriteria}
                    variant="image"
                    size="lg"
                    className="place-criteria-toggle flex h-full w-full flex-wrap items-stretch gap-1"
                  >
                    {placesDataset.criteria.map((criterion) => (
                      <ToggleGroupItem
                        key={criterion}
                        value={criterion}
                        style={filterImageStyle("criteria", criterion)}
                        className="basis-max h-auto min-h-0 grow px-2.5 py-1 text-center whitespace-nowrap"
                      >
                        {criterion}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup className="place-filter-group place-month-group shrink-0 p-0">
                <SidebarGroupContent
                  ref={monthContentRef}
                  className="place-month-grid grid h-full gap-1"
                >
                  {monthRows.map((row) => (
                    <ToggleGroup
                      key={row[0]}
                      value={selectedMonth ? [selectedMonth] : []}
                      onValueChange={(value) =>
                        setSelectedMonth(value[0] as Month | undefined)
                      }
                      variant="image"
                      size="lg"
                      className="grid h-full w-full grid-cols-3 gap-1"
                    >
                      {row.map((month) => (
                        <ToggleGroupItem
                          key={month}
                          value={month}
                          style={filterImageStyle("months", month)}
                          className="h-full"
                        >
                          {month}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          </SidebarContent>
          <SidebarFooter className="place-filter-credit p-3 pt-4 md:p-4 md:pt-8">
            <Item>
              <ItemMedia variant="image">
                <img
                  src={`${import.meta.env.BASE_URL}home-avatar.webp`}
                  alt=""
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  Made by <a href="https://alexislarin.com/">Alexis</a>
                </ItemTitle>
                <ItemDescription>
                  Photos provided by <a href="https://www.pexels.com/">Pexels</a>
                </ItemDescription>
              </ItemContent>
            </Item>
          </SidebarFooter>
        </Sidebar>
      </div>
      {mobileFiltersOpen && (
        <button
          type="button"
          className="place-filter-scrim absolute inset-0 z-20 hidden bg-primary/70"
          aria-label="Close filters"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}
      <MotionSidebarInset
        layoutScroll
        className="place-results @container min-h-0 overflow-y-auto p-3 md:p-4"
      >
        {hasPlaces ? (
          <div
            ref={gridRef}
            className="place-results-grid relative grid grid-flow-dense grid-cols-1 gap-1 @min-[41.25rem]:grid-cols-[repeat(auto-fill,minmax(20.5rem,1fr))]"
          >
            {places.map((place, index) => {
              const selected = selectedCard?.id === place.id
              const anchor =
                selected &&
                selectedCard.index === index &&
                selectedCard.columns === gridColumns
                  ? selectedCard
                  : gridAnchor(index, gridColumns)

              return (
                <PlaceCard
                  key={place.id}
                  place={place}
                  selected={selected}
                  multiColumn={gridColumns > 1}
                  placement={
                    selected && gridColumns > 1
                      ? {
                          gridColumn: `${anchor.column} / span 2`,
                          gridRow: `${anchor.row} / span 2`,
                        }
                      : undefined
                  }
                  onSelect={(card) => {
                    const cell = gridRef.current
                      ? currentGridCell(gridRef.current, card)
                      : gridAnchor(index, gridColumns)
                    const willExpand = selectedCard?.id !== place.id
                    if (willExpand) centerExpandedCardOnMobile(card)

                    setSelectedCard((current) => {
                      if (current?.id === place.id) return null

                      return {
                        id: place.id,
                        index,
                        columns: gridColumns,
                        column: Math.max(1, cell.column - 1),
                        row: cell.row,
                      }
                    })
                  }}
                />
              )
            })}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No places found</EmptyTitle>
              <EmptyDescription>Can't find anything :-/</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </MotionSidebarInset>
    </SidebarProvider>
  )
}

export default App
