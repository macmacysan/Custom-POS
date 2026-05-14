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
  LogOut,
  SlidersHorizontal,
  UserCog,
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
import { dispatchOpenSettings, dispatchOpenShortcutGuide } from "@/lib/app-hotkeys"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const {
    activeTab,
    setActiveTab,
    setActiveSection,
    currentUser,
    selectedBranch,
    logout,
    syncStatus,
  } = usePosStore()
  const activeSection = sectionForTab(activeTab)
  const hour = new Date().getHours()
  const dayGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

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
            Cashiers Report
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

      <div className="p-2 border-t shrink-0 border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-between rounded-md border border-sidebar-border bg-muted/20 px-2.5 hover:bg-muted/30"
            >
              <span className="flex items-center min-w-0 gap-2">
                <span className={`size-2 shrink-0 rounded-full ${
                  syncStatus === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                  syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                  syncStatus === 'error' ? 'bg-red-500' :
                  syncStatus === 'offline' ? 'bg-yellow-500' :
                  'bg-muted-foreground'
                }`} />
                <span className="text-xs font-semibold shrink-0">{currentUser?.username ?? 'User'}</span>
                <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {selectedBranch ?? 'Goa'}
                </span>
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 border-border bg-popover">
            <DropdownMenuLabel className="space-y-0.5">
              <p className="text-sm font-semibold">{dayGreeting}, {currentUser?.username ?? 'User'}!</p>
              <p className="text-[11px] font-normal text-muted-foreground">Current: {selectedBranch ?? 'Goa'} Branch</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={dispatchOpenShortcutGuide}>
              <UserCog className="size-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={dispatchOpenSettings}>
              <SlidersHorizontal className="size-4" />
              App Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}