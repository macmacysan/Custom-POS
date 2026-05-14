import * as React from "react"
import { Settings, Keyboard, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { useTheme } from "next-themes"

import { SettingsDialog } from "@/components/dialogs/settings-dialog"
import { ShortcutGuideDialog } from "@/components/dialogs/shortcut-guide-dialog"
import { MonthlyCalendarDialog } from "@/components/dialogs/monthly-calendar-dialog"

import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"


import { usePosStore } from "@/state/pos-store"
import { SECTION_LABELS, sectionForTab, tabLabel } from "@/lib/nav-sections"
import { kb } from "@/lib/keyboard-hints"
import { APP_HOTKEY_OPEN_SETTINGS, APP_HOTKEY_OPEN_SHORTCUT_GUIDE } from "@/lib/app-hotkeys"

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

  React.useEffect(() => {
    function onOpenGuide() {
      setShortcutOpen(true)
    }
    function onOpenSettings() {
      setSettingsOpen(true)
    }
    window.addEventListener(APP_HOTKEY_OPEN_SHORTCUT_GUIDE, onOpenGuide)
    window.addEventListener(APP_HOTKEY_OPEN_SETTINGS, onOpenSettings)
    return () => {
      window.removeEventListener(APP_HOTKEY_OPEN_SHORTCUT_GUIDE, onOpenGuide)
      window.removeEventListener(APP_HOTKEY_OPEN_SETTINGS, onOpenSettings)
    }
  }, [])

  const dateLabel = currentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const isTodaySelected = isSameDate(currentDate, new Date())

  const section = sectionForTab(activeTab)
  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-xs truncate text-muted-foreground">
            <span className="font-medium text-foreground">{SECTION_LABELS[section]}</span>
            <span className="mx-1.5 text-border">/</span>
            <span>{tabLabel(activeTab)}</span>
          </p>
          <p className="truncate text-[10px] text-muted-foreground lg:hidden">Open the menu for workspace pages and cashier tools.</p>
        </div>
          {!isTodaySelected && (
            <ActionTooltip label="Go to today" shortcut={kb.today()}>
              <Button type="button" variant="ghost" size="sm" aria-label="Go to today" onClick={goToToday}>
                TODAY
              </Button>
            </ActionTooltip>
          )}
        <div className="items-center hidden gap-1 p-1 lg:flex">
          <ActionTooltip label="Previous day" shortcut={kb.prevDay()}>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous day" onClick={() => changeDate(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
          </ActionTooltip>

          <MonthlyCalendarDialog>
            <Button type="button" variant="ghost" size="sm" className="min-w-[110px] text-xs font-semibold">
              {dateLabel}
            </Button>
          </MonthlyCalendarDialog>
        
          <ActionTooltip label="Next day" shortcut={kb.nextDay()}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Next day"
              onClick={() => changeDate(1)}
              disabled={isTodaySelected}
            >
              <ChevronRight className="size-4" />
            </Button>
          </ActionTooltip>
        </div>


        <ActionTooltip label="Workspace menu" shortcut={kb.sidebar()}>
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
        </ActionTooltip>
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
