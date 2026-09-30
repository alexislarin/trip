## Fancy a Trip? architecture

- Fancy a Trip? is a static frontend application. Production hosting is GitHub Pages.
- Production must continue to build into static files in `dist`; there is no production Node.js process, SSR, backend, server actions, server middleware, or runtime filesystem/database access.
- Stack: Vite + React + TypeScript + Tailwind CSS + shadcn/ui.
- shadcn/ui uses Base UI primitives. Preserve the `components.json` configuration and the `@/` alias.
- The official shadcn/ui coding-agent skill is installed at `.agents/skills/shadcn` and must be used for substantial shadcn work.
- Keep browser-visible configuration public. Do not add server-only secrets or private environment-variable assumptions.
- Keep GitHub Pages base-path handling intact: the deployment workflow provides `VITE_BASE_PATH`; local development defaults to `/`.

## UI and design-system changes

- Treat global visual decisions as design-system decisions, not per-screen styling. Keep the layers separate: global tokens, reusable `components/ui` customization, reusable product patterns, then page-specific layout.
- Prefer semantic CSS variables/tokens for recurring colors, typography, radii, borders, shadows, spacing, sizing, and related visual properties. Preserve shadcn semantics where possible: `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `card`, and `popover`.
- Do not use arbitrary colors, dimensions, radii, shadows, or repeated Tailwind overrides in screen components when they express a reusable visual rule. Arbitrary values remain appropriate for genuinely unique content or layout needs.
- When a shadcn component needs a system-wide visual change, update the reusable component in `src/components/ui` while preserving its API. Add explicit variants or sizes for intentional alternatives, and keep hover, focus, active/selected, and disabled states consistent. Prefer tokens, styles, and variants over unnecessary structural rewrites or instance-by-instance overrides.
- Before introducing a repeated visual value or pattern, consider an existing or new semantic token, a component variant, or a reusable product component. Do not promote a one-off page-layout decision into a global token.
- `DESIGN-SYSTEM.md` is the permanent, human-readable delta from the recorded shadcn baseline to this project’s design system. Update it in the same change whenever design-system work changes global typography, colors, radii, shadows, borders, reusable spacing/sizing, a reusable shadcn component, its variants/sizes, or a reusable product pattern. Ordinary page layout, content, ordering, and use of an unchanged component normally do not require an update.
