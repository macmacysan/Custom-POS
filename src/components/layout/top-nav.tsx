import * as React from "react"
import { Settings, Keyboard, ChevronLeft, ChevronRight } from "lucide-react"
import { useTheme } from "next-themes"

import { ModeToggle } from "@/components/mode-toggle"
import { SettingsDialog } from "@/components/dialogs/settings-dialog"
import { ShortcutGuideDialog } from "@/components/dialogs/shortcut-guide-dialog"
import { MonthlyCalendarDialog } from "@/components/dialogs/monthly-calendar-dialog"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import { usePosStore } from "@/state/pos-store"
import { cn } from "@/lib/utils"
import type { PosTab } from "@/types/pos"

const navItems: { id: PosTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "expenses", label: "Expenses" },
  { id: "checks", label: "Check" },
  { id: "income", label: "Other" },
  { id: "payments", label: "Payments" },
]

const installmentItems: { id: PosTab; label: string; description: string }[] = [
  {
    id: "installment",
    label: "Inhouse Installment",
    description: "Manage in-house installment plans and payment schedules.",
  },
  {
    id: "financing",
    label: "Finance Credit",
    description: "Track third-party financing and credit arrangements.",
  },
]

export function TopNav() {
  const { setTheme, theme } = useTheme()
  const {
    activeTab,
    setActiveTab,
    currentDate,
    changeDate,
    goToToday,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = usePosStore()

  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [shortcutOpen, setShortcutOpen] = React.useState(false)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 })

  const dateLabel = currentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const isInstallmentActive = ["installment", "financing"].includes(activeTab)

  const updateIndicator = React.useCallback((tabId: string) => {
    const el = containerRef.current?.querySelector(
      `[data-tab="${tabId}"]`
    ) as HTMLElement | null
    if (el && containerRef.current) {
      const rect = el.getBoundingClientRect()
      const parentRect = containerRef.current.getBoundingClientRect()
      setIndicatorStyle({ left: rect.left - parentRect.left, width: rect.width })
    }
  }, [])

  React.useEffect(() => {
    updateIndicator(activeTab)
  }, [activeTab, updateIndicator])

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">

        {/* NAV */}
        <div className="relative flex flex-1 items-center gap-1" ref={containerRef}>

          {/* Regular tabs — hover + click to switch */}
          {navItems.map((item) => (
            <Button
              key={item.id}
              data-tab={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={() => setActiveTab(item.id)}
              className={cn(
                "h-9 px-3 text-sm",
                activeTab === item.id && "text-foreground"
              )}
            >
              {item.label}
            </Button>
          ))}

          {/*
           * KEY FIX: Installment has its OWN <NavigationMenu> root.
           * shadcn's NavigationMenuViewport is absolutely positioned at
           * left:0 of the nearest NavigationMenu root. When shared with
           * all nav items, it anchors to the far left of the container.
           * Isolating it here makes the viewport open directly below
           * this trigger only.
           */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  data-tab="installment"
                  onMouseEnter={() => updateIndicator("installment")}
                  onMouseLeave={() => updateIndicator(activeTab)}
                  className={cn(
                    "h-9 px-3 text-sm bg-transparent hover:bg-accent data-[state=open]:bg-accent",
                    isInstallmentActive && "text-foreground"
                  )}
                >
                  Installment
                </NavigationMenuTrigger>

                <NavigationMenuContent>
                  <ul className="w-64 p-1">
                    {installmentItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            "w-full rounded-md px-3 py-2.5 text-left transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            activeTab === item.id && "bg-accent/60"
                          )}
                        >
                          <div className="text-sm font-medium leading-none mb-1">
                            {item.label}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Animated underline */}
          <span
            className="pointer-events-none absolute bottom-0 h-[2px] bg-primary transition-all duration-300 ease-out"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />
        </div>

        {/* DATE CONTROLS */}
        <div className="hidden items-center gap-1 rounded-md border bg-muted/40 p-1 lg:flex">
          <Button variant="ghost" size="icon-sm" onClick={() => changeDate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>

          <MonthlyCalendarDialog>
            <Button variant="ghost" size="sm" className="min-w-[110px] text-xs font-semibold">
              {dateLabel}
            </Button>
          </MonthlyCalendarDialog>

          <Button variant="ghost" size="icon-sm" onClick={() => changeDate(1)}>
            <ChevronRight className="size-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={goToToday}>
            TODAY
          </Button>
        </div>

        {/* ACTIONS */}
        <Button variant="outline" size="icon-sm" onClick={() => setShortcutOpen(true)}>
          <Keyboard className="size-4" />
        </Button>

        <Button variant="outline" size="icon-sm" onClick={() => setSettingsOpen(true)}>
          <Settings className="size-4" />
        </Button>

        <ModeToggle />

        <Button
          variant="outline"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setMobileSidebarOpen((v) => !v)}
        >
          =
        </Button>
      </header>

      {/* DIALOGS */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onQuickTheme={(nextTheme) => setTheme(nextTheme)}
        currentTheme={theme ?? "dark"}
      />

      <ShortcutGuideDialog open={shortcutOpen} onOpenChange={setShortcutOpen} />

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </>
  )
}