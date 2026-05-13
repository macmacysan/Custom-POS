import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  ChevronsUpDown,
  Store,
  Wallet,
  Boxes,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  SECTION_LABELS,
  SECTION_ORDER,
  SECTION_TABS,
  sectionForTab,
  workspaceTabHotkeyDigit,
} from "@/lib/nav-sections"
import { usePosStore } from "@/state/pos-store"
import type { NavSection, PosTab } from "@/types/pos"
import { kb } from "@/lib/keyboard-hints"

const sectionIcons: Record<NavSection, typeof Package> = {
  inventory: Package,
  sales: Store,
  reports: BarChart3,
}

const tabIcons: Record<PosTab, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  items: Boxes,
  expenses: Receipt,
  checks: Landmark,
  income: Wallet,
  payments: CreditCard,
  installment: CalendarDays,
  financing: Building2,
}

export function WorkspaceNavigationSidebar({
  className,
  onTabSelect,
}: {
  className?: string
  onTabSelect?: () => void
}) {
  const { activeTab, setActiveTab, setActiveSection } = usePosStore()
  const activeSection = sectionForTab(activeTab)

  return (
    <aside className={cn("flex min-h-0 flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className="flex shrink-0 items-center gap-2 border-b border-sidebar-border px-3 py-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-foreground text-background shadow-sm"
          aria-hidden
        >
          <span className="text-[11px] font-black leading-none">POS</span>
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">Custom POS</p>
          <p className="truncate text-[11px] text-muted-foreground">Nueva Camsur Home Furnishing</p>
        </div>
        <span
          className="flex size-7 shrink-0 items-center justify-center text-muted-foreground opacity-40"
          aria-hidden
        >
          <ChevronsUpDown className="size-4" />
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-2 py-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <div className="flex flex-col gap-0.5">
            {SECTION_ORDER.map((section) => {
              const SectionIcon = sectionIcons[section]
              const isActiveSection = activeSection === section
              const tabs = SECTION_TABS[section]

              return (
                <Collapsible
                  key={section}
                  open={isActiveSection}
                  onOpenChange={(next) => {
                    if (next && !isActiveSection) setActiveSection(section)
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "h-9 w-full justify-between gap-2 rounded-md px-2 font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActiveSection && "bg-sidebar-accent/80 text-sidebar-accent-foreground",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SectionIcon className="size-4 shrink-0 opacity-80" />
                        <span className="truncate text-sm">{SECTION_LABELS[section]}</span>
                      </span>
                      {isActiveSection ? (
                        <ChevronDown className="size-4 shrink-0 opacity-60" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 opacity-60" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="relative ml-3.5 border-l border-sidebar-border py-1 pl-3">
                      {tabs.map((item) => {
                        const TabIcon = tabIcons[item.id]
                        const isActive = activeTab === item.id
                        const digit = workspaceTabHotkeyDigit(item.id)
                        return (
                          <ActionTooltip
                            key={item.id}
                            label={item.label}
                            shortcut={digit !== undefined ? kb.workspaceTab(digit) : undefined}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              className={cn(
                                "mb-0.5 h-8 w-full justify-start gap-2 rounded-md px-2 text-sm font-normal text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive &&
                                  "bg-muted font-medium text-foreground shadow-none hover:bg-muted dark:bg-sidebar-accent dark:text-sidebar-accent-foreground",
                              )}
                              onClick={() => {
                                setActiveTab(item.id)
                                onTabSelect?.()
                              }}
                            >
                              <TabIcon className="size-3.5 shrink-0 opacity-70" />
                              <span className="truncate">{item.label}</span>
                            </Button>
                          </ActionTooltip>
                        )
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
