import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * Redesigned Calendar component based on macOS Calendar aesthetic
 * Features:
 * - Larger, more spacious calendar grid
 * - Better visual hierarchy
 * - Improved date cell styling
 * - Modern rounded corners and spacing
 */
function CalendarRedesigned({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar w-full bg-background p-8",
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn("flex flex-col w-full", defaultClassNames.months),
        month: cn("w-full", defaultClassNames.month),
        nav: cn(
          "flex w-full items-center justify-between gap-6 mb-8",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "size-8 p-0 select-none aria-disabled:opacity-30 rounded-lg hover:bg-muted transition-colors flex items-center justify-center",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "size-8 p-0 select-none aria-disabled:opacity-30 rounded-lg hover:bg-muted transition-colors flex items-center justify-center",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center px-0 py-0",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "text-2xl font-bold tracking-tight",
          defaultClassNames.caption_label
        ),
        weekdays: cn("grid grid-cols-7 gap-0 mb-4", defaultClassNames.weekdays),
        weekday: cn(
          "text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest h-8 flex items-center justify-center",
          defaultClassNames.weekday
        ),
        week: cn("grid grid-cols-7 gap-1 mb-1", defaultClassNames.week),
        week_number: cn("w-0 select-none", defaultClassNames.week_number),
        day: cn(
          "relative text-center text-sm select-none h-12",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-primary text-primary-foreground rounded-l-lg font-semibold",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "bg-primary/20 rounded-none font-medium",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "bg-primary text-primary-foreground rounded-r-lg font-semibold",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-primary text-primary-foreground font-bold rounded-lg ring-2 ring-primary/50 ring-inset",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/30",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground/30",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, ...props }) => (
          <div
            data-slot="calendar"
            className={cn("w-full", className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          const chevronClass = cn("size-5", className)
          if (orientation === "left") {
            return <ChevronLeft className={chevronClass} {...props} />
          }
          if (orientation === "right") {
            return <ChevronRight className={chevronClass} {...props} />
          }
          return <ChevronRight className={chevronClass} {...props} />
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButtonRedesigned {...props} />
        ),
        WeekNumber: ({ children, ...props }) => (
          <td {...props} className="w-0">
            <div className="w-0">{children}</div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButtonRedesigned({
  className,
  day,
  modifiers,
  ...props
}: {
  className?: string
  day: { date: Date }
  modifiers: Record<string, boolean>
  [key: string]: unknown
}) {
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isToday = modifiers.today
  const isSelected = modifiers.selected
  const isDisabled = modifiers.disabled
  const isOutside = modifiers.outside

  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        "h-12 w-full font-semibold rounded-lg transition-all duration-200",
        isDisabled && "opacity-30 cursor-not-allowed",
        isOutside && "text-muted-foreground/30",
        isToday && "bg-primary text-primary-foreground ring-2 ring-primary/50 ring-inset hover:bg-primary/90",
        isSelected && !isToday && "bg-primary/20 text-foreground hover:bg-primary/30",
        !isSelected && !isToday && !isDisabled && !isOutside && "hover:bg-muted/60",
        className
      )}
      {...props}
    />
  )
}

export { CalendarRedesigned, CalendarDayButtonRedesigned }
