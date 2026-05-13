import * as React from "react"
import { Settings, Keyboard, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { useTheme } from "next-themes"

import { ModeToggle } from "@/components/mode-toggle"
import { SettingsDialog } from "@/components/dialogs/settings-dialog"
import { ShortcutGuideDialog } from "@/components/dialogs/shortcut-guide-dialog"
import { MonthlyCalendarDialog } from "@/components/dialogs/monthly-calendar-dialog"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ActionTooltip } from "@/components/ui/action-tooltip"

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
    syncStatus,
    syncError,
    lastSyncTime,
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
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Next day" onClick={() => changeDate(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </ActionTooltip>

          <ActionTooltip label="Go to today" shortcut={kb.today()}>
            <Button type="button" variant="ghost" size="sm" aria-label="Go to today" onClick={goToToday}>
              TODAY
            </Button>
          </ActionTooltip>
        </div>

        <div className="ml-auto hidden items-center lg:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-default items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1 text-xs font-medium">
                <span className={`size-2 shrink-0 rounded-full ${
                  syncStatus === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                  syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                  syncStatus === 'error' ? 'bg-red-500' :
                  syncStatus === 'offline' ? 'bg-yellow-500' :
                  'bg-muted-foreground'
                }`} />
                <span className="hidden sm:inline-block">
                  {syncStatus === 'success' ? 'Connected' :
                   syncStatus === 'syncing' ? 'Syncing...' :
                   syncStatus === 'error' ? 'Cannot connect' :
                   syncStatus === 'offline' ? 'Offline' :
                   'Not connected'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="max-w-[250px]">
              <div className="space-y-1 text-xs">
                <p className="font-semibold">Sync Status: <span className="capitalize">{syncStatus}</span></p>
                {lastSyncTime && <p className="text-muted-foreground">Last sync: {lastSyncTime.toLocaleTimeString()}</p>}
                {syncError && <p className="mt-1 break-words text-red-400">{syncError}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <ActionTooltip label="Keyboard shortcuts" shortcut={kb.shortcuts()}>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Keyboard shortcuts"
            onClick={() => setShortcutOpen(true)}
            className="ml-auto lg:ml-0"
          >
            <Keyboard className="size-4" />
          </Button>
        </ActionTooltip>

        <ActionTooltip label="Settings" shortcut={kb.settings()}>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-4" />
          </Button>
        </ActionTooltip>

        <ModeToggle />

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
