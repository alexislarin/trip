import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-muted aria-pressed:bg-muted data-[state=on]:bg-muted",
        outline: "border border-input bg-transparent hover:bg-muted aria-pressed:bg-muted data-[state=on]:bg-muted",
        image:
          "border-0 bg-[image:var(--toggle-image)] bg-cover bg-center [background-blend-mode:multiply] [background-color:var(--toggle-tint)] text-sidebar-foreground shadow-none [--toggle-tint:color-mix(in_srgb,var(--toggle-overlay-color,var(--background))_75%,white)] hover:[background-color:var(--toggle-tint)] hover:text-sidebar-foreground hover:[--toggle-tint:color-mix(in_srgb,var(--toggle-overlay-color,var(--background))_50%,white)] focus-visible:border-transparent aria-pressed:[background-color:var(--toggle-tint)] aria-pressed:text-sidebar-foreground aria-pressed:[--toggle-tint:white]",
      },
      size: {
        default:
          "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    compoundVariants: [
      {
        variant: "image",
        size: "lg",
        className: "text-paragraph-small",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ToggleVariants = VariantProps<typeof toggleVariants>
type ToggleVariant = NonNullable<ToggleVariants["variant"]>
type ToggleSize = NonNullable<ToggleVariants["size"]>
type ToggleStyleProps =
  | {
      variant?: Exclude<ToggleVariant, "image">
      size?: ToggleSize
    }
  | {
      variant: "image"
      size: "lg"
    }

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & ToggleStyleProps) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants, type ToggleStyleProps }
