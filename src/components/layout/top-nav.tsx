import * as React from "react"
import { Settings, Keyboard, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { useTheme } from "next-themes"

import { ModeToggle } from "@/components/mode-toggle"
import { SettingsDialog } from "@/components/dialogs/settings-dialog"
import { ShortcutGuideDialog } from "@/components/dialogs/shortcut-guide-dialog"
import { MonthlyCalendarDialog } from "@/components/dialogs/monthly-calendar-dialog"

import { Button } from "@/components/ui/button"

import { usePosStore } from "@/state/pos-store"
import { SECTION_LABELS, sectionForTab, tabLabel } from "@/lib/nav-sections"

export function TopNav() {
  const { setTheme, theme } = useTheme()
  const {
    activeTab,
    currentDate,
    changeDate,
    goToToday,
    setMobileSidebarOpen,
  } = usePosStore()

  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [shortcutOpen, setShortcutOpen] = React.useState(false)

  const dateLabel = currentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const section = sectionForTab(activeTab)

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{SECTION_LABELS[section]}</span>
            <span className="mx-1.5 text-border">/</span>
            <span>{tabLabel(activeTab)}</span>
          </p>
          <p className="truncate text-[10px] text-muted-foreground lg:hidden">Open the menu for workspace pages and cashier tools.</p>
        </div>

        <div className="hidden items-center gap-1 rounded-md border border-border bg-surface p-1 lg:flex">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => changeDate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>

          <MonthlyCalendarDialog>
            <Button type="button" variant="ghost" size="sm" className="min-w-[110px] text-xs font-semibold">
              {dateLabel}
            </Button>
          </MonthlyCalendarDialog>

          <Button type="button" variant="ghost" size="icon-sm" onClick={() => changeDate(1)}>
            <ChevronRight className="size-4" />
          </Button>

          <Button type="button" variant="ghost" size="sm" onClick={goToToday}>
            TODAY
          </Button>
        </div>

        <Button type="button" variant="outline" size="icon-sm" onClick={() => setShortcutOpen(true)}>
          <Keyboard className="size-4" />
        </Button>

        <Button type="button" variant="outline" size="icon-sm" onClick={() => setSettingsOpen(true)}>
          <Settings className="size-4" />
        </Button>

        <ModeToggle />

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileSidebarOpen((v) => !v)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-4" />
        </Button>
      </header>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onQuickTheme={(nextTheme) => setTheme(nextTheme)}
        currentTheme={theme ?? "dark"}
      />

      <ShortcutGuideDialog open={shortcutOpen} onOpenChange={setShortcutOpen} />
    </>
  )
}
