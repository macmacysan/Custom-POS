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
      {/* ── Header: tighter padding, smaller logo badge ── */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-sidebar-border px-2 py-2">
        <div
          className="flex items-center justify-center border rounded shadow-sm size-7 shrink-0 border-border bg-foreground text-background"
          aria-hidden
        >
          <span className="text-[9px] font-black leading-none">POS</span>
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-xs font-semibold tracking-tight truncate text-sidebar-foreground">
            Custom POS
          </p>
          <p className="truncate text-[10px] text-muted-foreground">Nueva Camsur Home Furnishing</p>
        </div>
        <span
          className="flex items-center justify-center size-6 shrink-0 text-muted-foreground opacity-40"
          aria-hidden
        >
          <ChevronsUpDown className="size-3.5" />
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-1.5 py-2">
          {/* ── Section label ── */}
          <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>

          <div className="flex flex-col gap-px">
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
                  {/* ── Section trigger: h-7 instead of h-9 ── */}
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "h-7 w-full justify-between gap-1.5 rounded px-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActiveSection && "bg-sidebar-accent/80 text-sidebar-accent-foreground",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <SectionIcon className="size-3.5 shrink-0 opacity-80" />
                        <span className="truncate">{SECTION_LABELS[section]}</span>
                      </span>
                      {isActiveSection ? (
                        <ChevronDown className="size-3 shrink-0 opacity-60" />
                      ) : (
                        <ChevronRight className="size-3 shrink-0 opacity-60" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    {/* ── Tab list: tighter indent, smaller border ── */}
                    <div className="relative ml-3 border-l border-sidebar-border py-0.5 pl-2.5">
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
                                "mb-px h-6 w-full justify-start gap-1.5 rounded px-1.5 text-xs font-normal text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive &&
                                  "bg-muted font-medium text-foreground shadow-none hover:bg-muted dark:bg-sidebar-accent dark:text-sidebar-accent-foreground",
                              )}
                              onClick={() => {
                                setActiveTab(item.id)
                                onTabSelect?.()
                              }}
                            >
                              <TabIcon className="size-3 shrink-0 opacity-70" />
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