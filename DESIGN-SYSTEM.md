# Design system

This document records the durable delta between the initial shadcn baseline and
Fancy a Trip’s design system. Keep the **Baseline** fixed. Record later visual
system decisions only in the delta sections, not as changes to the baseline.

The intended transfer path is:

```text
matching shadcn Figma kit → documented overrides below → Fancy a Trip screens
```

## Baseline

### Evidence and scope

- Source of truth: `components.json`, `package.json`, `pnpm-lock.yaml`,
  `src/index.css`, `vite.config.ts`, and `src/components/ui`.
- This checkout has no Git commits, so there is no revision history with which
  to prove whether a source file was generated unchanged or edited before this
  document. Values listed here are the installed configuration and source at
  the time this document was created; do not infer an undocumented earlier
  state.
- The installed shadcn CLI package is `shadcn` **4.21.0** (locked); its package
  manifest declares `^4.21.0`. A CLI inspection was not available during this
  recording because its registry request could not resolve, so no unverified
  preset code or Figma-kit version is recorded.

### Setup that determines the starting appearance

| Setting                       | Recorded baseline                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework/build               | Vite **8.3.0** + React **19.3.0** + TypeScript **6.0.3** (lockfile-resolved); Vite uses `@tailwindcss/vite` and the `@/` alias.                                                |
| Tailwind                      | Tailwind CSS **4.3.3** with `tw-animate-css` **1.4.0** (lockfile-resolved); no separate Tailwind configuration file.                                                           |
| shadcn style                  | `base-nova` in `components.json`. The primitive base is Base UI, with `rsc: false`.                                                                                            |
| Base color                    | `neutral`.                                                                                                                                                                     |
| CSS variables                 | Enabled (`cssVariables: true`), no prefix. Tailwind’s `@theme inline` maps semantic variables in `src/index.css`.                                                              |
| Icons                         | Lucide: `lucide-react` **1.46.0**.                                                                                                                                             |
| Font                          | Geist Variable, from `@fontsource-variable/geist` **5.3.0**; `--font-sans` is `'Geist Variable', sans-serif`, and `--font-heading` equals `--font-sans`.                       |
| Radius                        | `--radius: 0.625rem`; derived `sm`–`4xl` values are defined in `src/index.css`.                                                                                                |
| Theme modes                   | Light values live in `:root`; dark values live in `.dark`. `ThemeProvider` applies the system setting by default and stores the selected theme in local storage under `theme`. |
| Other initialization settings | `tsx: true`, `rtl: false`, `menuColor: default`, `menuAccent: subtle`; standard aliases point to `src/components`, `src/components/ui`, `src/lib`, and `src/hooks`.            |

### Token locations and values

- The global token source is [`src/index.css`](src/index.css). It imports
  Tailwind, shadcn’s Tailwind layer, animation utilities, and Geist; defines
  the Tailwind token mapping in `@theme inline`; and defines light and dark
  semantic variables.
- Semantic color families already present: `background`, `foreground`,
  `card`, `popover`, `primary`, `secondary`, `muted`, `accent`,
  `destructive`, `border`, `input`, `ring`, `chart-1` through `chart-5`, and
  `sidebar` (each with its relevant foreground/related values). Their concrete
  initial values are the OKLCH declarations in that file.
- The reusable shadcn component source is [`src/components/ui`](src/components/ui):
  `badge`, `button`, `card`, `empty`, `input`, `separator`, `sheet`,
  `sidebar`, `skeleton`, `toggle`, `toggle-group`, and `tooltip`.

### Matching Figma baseline

Use a shadcn Figma kit that explicitly supports the **Nova/Base UI visual
style**, **neutral** base color, Geist typography, the 0.625rem radius scale,
and both light and dark semantic color modes above. At the time this baseline
was recorded, no Figma kit was configured or linked in this repository. The
Figma sync section below records the kit selected later and its observed gaps;
the original code baseline remains unchanged.

## Tokens — intentional overrides

The global radius scale is deliberately square: `--radius` is `0px`, and the
base layer sets every element’s `border-radius` to `0` to cover fixed-radius
utilities in the shadcn baseline.

| Token                                                                 | Baseline/default        | Current                 | Purpose                                                        |
| --------------------------------------------------------------------- | ----------------------- | ----------------------- | -------------------------------------------------------------- |
| `--radius`                                                            | `0.625rem`              | `0px`                   | Removes rounding across the design system.                     |
| `--sidebar`, `--sidebar-foreground`                                   | Near-white / near-black | Black / white           | Provides the high-contrast filter sidebar in both theme modes. |
| `--font-sans`                                                         | Geist Variable          | Hanken Grotesk Variable | Matches the Figma body-family token.                           |
| `--font-heading`                                                      | Geist Variable          | Gloock Regular          | Matches the Figma heading-family token.                        |
| `--font-mono`                                                         | System monospace        | Geist Mono Variable     | Matches the Figma monospace-family token.                      |
| `--font-card-title`                                                   | Not present             | Geist Variable          | Preserves the kit's separate standard CardTitle text styles.   |
| `--text-caption`, `--text-caption--line-height`, `--tracking-caption` | Not present             | 11px, 14px, 1px         | Matches the Figma `caption` Text Style.                        |
| `--text-paragraph-small`, `--text-paragraph-small--line-height`       | Not present             | 14px, 20px              | Matches the Figma `paragraph small` Text Style.                |
| `--text-display`, `--text-display--line-height`                       | Not present             | 60px, 1                | Matches the Figma `Display` Text Style on expanded cards.     |
| `--heading-letter-spacing`                                            | Not present             | `-0.02em`               | Matches the Figma heading 1–4 tracking of −2%.                 |
| `--secondary`                                                          | Neutral 100 / 800       | Neutral 400 / 700       | Matches the updated Figma `general/secondary` token by mode.  |

## Components — intentional overrides

| Component | Difference from baseline                                | Added variants/sizes | Notes                                                                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Toggle    | Supports photographic filter surfaces without a border. | `image` variant, `size="lg"` only | The photo uses one background layer blended with a tint, avoiding bright edge pixels from separately composited layers. Image opacity is 25% at rest, 50% on hover, and 100% while selected; sidebar filters supply a black tint color and white text. Image Toggles use `paragraph small/medium` (Hanken Grotesk Medium, 14px/20px); `default` and `sm` are not supported for this skin. |
| Badge     | Uses the Figma `caption` Text Style.                    | —                    | Hanken Grotesk Regular, 13px/20.5px, 1px tracking, uppercase; height follows the text and padding. Applies to all variants, including place-card tags.                                                                                                 |
| Button    | Large buttons use the Figma `paragraph large/medium` Text Style. | `size="lg"` | Hanken Grotesk Medium, 18px/27px. This applies to every Button variant and state. |

## New reusable patterns

| Pattern              | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Code location                  | Figma counterpart                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------- |
| Sidebar filter panel | Fills the sidebar’s padded height with criterion and month image toggles. Its width is 20vw, capped at 400px. The shared row height is calculated from the actual wrapped criterion rows, month rows, available panel height, and gaps; it grows to fit the tallest label when needed.                                                                                                                                                                                                                                                                                                              | `src/App.tsx`, `src/index.css` | `Sidebar Filter Panel` on the kit's Sidebar page. |
| Place photo card     | Prefers a 3:2 ratio without a border at rest and grows taller when a long title needs more lines. One photo fills it; two split left/right; three place the first on the left and stack the others on the right. The split varies from 40/60 to 60/40 through a repeating CSS sequence, shared by the two-photo columns and both axes of the three-photo layout. The title and content-driven symbol Badge area are grouped at the bottom over unshaded photos, without photo captions. A 12px gap separates the title and badges; the lower card padding uses XL (24px). The results grid keeps each card at least 328px wide below a 1440px viewport so three fit alongside the sidebar at 1280px; from 1440px it uses a 400px minimum. Symbol badges retain their source order and identical styling when filters change. Card gaps match the sidebar toggle gap. | `src/App.tsx`, `src/index.css` | `Place Photo Card` on the kit's Card page.        |

The results grid uses dense CSS Grid placement. Clicking a photo card selects it;
on a grid wide enough for two 328px columns, the selected card spans two columns
and rows. Motion animates the selected card and the cards reflowing around it.
Places without any criterion availability are omitted from the results.
The expanded card uses the Figma Display style for its title. Its original-ratio
photos start at the top in their source order from left to right: the first
occupies the left third, the second occupies the central half, and the third
occupies the right third. The first photo sits above the other layers. A 4px
white border sits inside the expanded card. A single photo uses the central
half. The bottom content follows the Figma
auto layout: title and symbols in the left half, aligned to the bottom with a
16px gap; matching criterion and availability Badge columns in the right half,
aligned to the bottom right. Existing semantic colors style the badges. A card
in a right-hand column keeps its row and right edge while expanding leftward.
When switching cards, the new card expands from its current CSS Grid cell, even
if dense placement has moved it away from its original list position.
The scroll container does not apply browser scroll anchoring while an expanded
card above the viewport collapses, so selecting a visible card does not scroll
the results upward.
The other cards fill the remaining cells. At the one-column grid breakpoint,
the expanded card lays out photos, an LG gap, and its content in normal flow,
and hugs that composition at its natural height. When availability moves below
the title, its Badge columns stay aligned to the card's right edge. Clicking
the selected card collapses it.

At 640px and below, a full-width large Link Button on the `sidebar` surface
centers its selected criteria and month with its chevron, or “Select interests...” when no filter is selected.
It shortens a summary to
the criterion count when the full text does not fit. The bar toggles the
existing filter panel over the cards, directly beneath it, at 80% of viewport
height. A translucent `primary` scrim covers the cards and closes the panel
when tapped. A chevron indicates the panel state. Mobile typography and
rem-based spacing scale continuously from 100% at 640px to 80% at 320px.

On wider screens, the sidebar occupies 20% of the viewport up to 400px. The
results grid keeps cards at least 400px wide; narrow screens switch to the
single-column layout.

## Figma transfer notes

- Create Figma Variables for intentional code-token overrides, preserving the
  semantic names rather than translating them into screen-specific labels.
- Modify only the matching kit components documented in **Components**, and
  create the documented component variants and product patterns there.
- Keep a change trace: every Figma variable, component adjustment, or variant
  should point back to a row in this document; every system-level code change
  should add or update that row in the same task.
- Do not treat page-specific layout classes as kit-level changes unless they
  have become a documented reusable pattern or token.

## Figma library sync (2026-09-29)

The target file is [Fancy a trip Library Sol](https://www.figma.com/design/45155iSs4HcJHou5Fr0FaJ/Fancy-a-trip-Library-Sol). It is a copy of the Obra Studio shadcn/ui **Nova Community** kit. Its changelog identifies Nova Community, but the file does not establish a matching shadcn CLI version or Base UI implementation. The project remains `base-nova` on Base UI, with the code as the current value source.

The kit already had `shadcn colors` with `shadcn` and `shadcn-dark` modes, neutral aliases, Geist Text Styles, effect styles, radius and spacing collections, and native component sets. Those structures were reused. The kit baseline differed from the recorded code baseline in at least these ways: `radius-2xl` was 16px rather than 18px; neutral 400 was the older #a3a3a3 rather than the CSS OKLCH gray; several semantic colors referenced different neutral steps; the kit's Card set lacked the code's `size="sm"` choice; and kit-only component options and typography styles do not imply equivalent code APIs.

The existing radius variables now resolve to 0, including out-of-scale and full radii, so existing component bindings make corners square. The existing neutral raw variables and semantic color aliases now match `src/index.css` in both modes. Three missing raw values were added in `theme` for the exact destructive light/dark colors and the dark sidebar primary. The results surface uses the existing `primary` semantic color; no product-specific results-surface token remains. The chart colors now alias the grayscale used by the code. Existing Text Styles were applied to previously unstyled Button Link and extra-small Toggle labels. `controls/small/medium` brings the kit's 14px Small Button and Toggle labels to the code's 0.8rem (12.8px). `card/title/default` and `card/title/small` describe the code's CardTitle typography for the two Card sizes.

Typography was refreshed from the same Figma file on 2026-09-29. The `typography` collection now names Hanken Grotesk for body text, Gloock for headings, and Geist Mono for monospace. The `Place Photo Card` title uses the `heading 1` Text Style. Gloock provides only a regular font file, so the rendered title uses weight 400 even though the Figma heading weight variable says “Medium”; the linked Text Style and title node both resolve to Regular/400. The standard `CardTitle` styles remain Geist Medium and use `--font-card-title` in code.

The heading update sets `heading 1` and the place-card title to 40px with a 48px line height. All four Figma heading Text Styles use −2% letter spacing; heading-family titles in code use the corresponding `-0.02em` token. Figma's FLOAT tracking variables are now named with `(%)` and hold `-2`, but the Text Styles use a direct percentage value: setting `PERCENT` through the available Plugin API removes the variable binding, while keeping it would render −2px. Size and line-height bindings remain intact.

The expanded Place Photo Card examples in Figma show three, two, and one photo. Their `Display` Text Style resolves to Gloock Regular at 60px/60px with −2% tracking. The updated `general/secondary` aliases neutral 400 in light mode and neutral 700 in dark mode; code uses the corresponding OKLCH neutral values.

The existing Toggle Button set gained an `Image` skin in its one supported code size, `large`, with selected/unselected states and default, hover, focus, and disabled states. Its `large` label uses the `paragraph small/medium` Text Style. The existing Card set gained `Size=Small` variants using its already available Small section spacing. `Place Photo Card` is a separate single-photo component made from Card and Badge instances plus an editable photo fill; the two- and three-photo arrangements remain code-only. Its symbol Badge area has content-driven height, so the title and badges stay grouped at the bottom rather than reserving three rows. All nonzero component padding and gaps use existing spacing variables. `Sidebar Filter Panel` is a separate component made from a Sidebar instance and 28 Image Toggle instances. The kit's Sidebar main has no swappable content slot, so the new panel hides its sample menu content while retaining the Sidebar instance as the surface.

The Figma photo fills are editable sample assets from the kit. The Figma Plugin API connection did not support URL image import, so these examples do not carry the production Pexels photos. The sidebar's computed row height remains runtime behavior; Figma stores a representative editable layout.

Kit-only examples and atoms with ellipse geometry or unbound local radii (such as avatar and radio placeholders) were not reshaped: the repository does not establish a code counterpart for every kit example, and changing those structures would be a separate library decision. The new panel keeps the kit Sidebar instance and hides its fixed sample menu; a future replaceable content slot would make that composition more flexible.

## Existing project-specific UI observed before this document

- `src/App.tsx` composes the installed sidebar, toggle group, card, badge, and
  empty-state components into the destination filtering screen. Its responsive
  grid and filter wrapping are page layout/content behavior, not a recorded
  design-system override.
- `src/components/theme-provider.tsx` adds runtime selection of the existing
  light/dark token modes. It does not introduce a separate visual token set.
- Because the checkout has no commits, no component or token deviation can be
  confidently attributed to a pre-existing customization. Do not retrospectively
  add an entry unless a reliable source establishes that difference.
