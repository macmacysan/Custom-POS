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
    settings,
  } = usePosStore()
  const isDarkSidebar = settings.sidebarAlwaysDark
  const activeSection = sectionForTab(activeTab)
  const hour = new Date().getHours()
  const dayGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        isDarkSidebar && "dark bg-slate-950 text-slate-50 border-r-slate-800",
        className
      )}
    >
      {/* ── Header: tighter padding, smaller logo badge ── */}
      <div className={cn("flex shrink-0 items-center gap-2 border-b px-3 py-3", isDarkSidebar ? "border-slate-800" : "border-sidebar-border")}>
        <div
          className="flex items-center justify-center border rounded shadow-sm size-7 shrink-0 border-border bg-foreground text-background"
          aria-hidden
        >
          <span className="text-[10px] font-black leading-none">POS</span>
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-sm font-bold tracking-tight truncate text-sidebar-foreground">
            Cashiers Report
          </p>
          <p className="truncate text-[10px] text-muted-foreground opacity-70 font-medium">Nueva Camsur Home Furnishing</p>
        </div>
        <span
          className="flex items-center justify-center size-6 shrink-0 text-muted-foreground opacity-30"
          aria-hidden
        >
          <ChevronsUpDown className="size-3" />
        </span>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-2 py-4">
          {/* ── Section label ── */}
          <p className={cn("mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em]", isDarkSidebar ? "text-slate-500" : "text-muted-foreground/60")}>
            Workspace
          </p>

          <div className="flex flex-col gap-1">
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
                  {/* ── Section trigger ── */}
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "h-8 w-full justify-between gap-2 rounded-md px-2 text-xs font-semibold text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActiveSection && "bg-sidebar-accent/50 text-sidebar-accent-foreground shadow-sm",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SectionIcon className={cn("size-3.5 shrink-0 transition-opacity", isActiveSection ? "opacity-100" : "opacity-60")} />
                        <span className="truncate">{SECTION_LABELS[section]}</span>
                      </span>
                      {isActiveSection ? (
                        <ChevronDown className="size-3 shrink-0 opacity-40" />
                      ) : (
                        <ChevronRight className="size-3 shrink-0 opacity-40" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    {/* ── Tab list ── */}
                    <div className={cn("relative ml-4 mt-1 border-l py-1 pl-3 space-y-0.5", isDarkSidebar ? "border-slate-800" : "border-sidebar-border")}>
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
                                "h-7 w-full justify-start gap-2 rounded px-2 text-xs transition-all font-medium",
                                isActive
                                  ? "bg-primary/10 text-primary shadow-none hover:bg-primary/15"
                                  : "text-muted-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                              onClick={() => {
                                setActiveTab(item.id)
                                onTabSelect?.()
                              }}
                            >
                              <TabIcon className={cn("size-3 shrink-0 transition-opacity", isActive ? "opacity-100" : "opacity-60")} />
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

      <div className="p-3 border-t shrink-0 border-sidebar-border bg-sidebar/30 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-between rounded-lg border border-sidebar-border bg-muted/20 px-3 hover:bg-muted/30 transition-all shadow-sm"
            >
              <span className="flex items-center min-w-0 gap-2.5">
                <span className={`size-2 shrink-0 rounded-full ${
                  syncStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                  syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                  syncStatus === 'error' ? 'bg-red-500' :
                  syncStatus === 'offline' ? 'bg-amber-500' :
                  'bg-muted-foreground'
                }`} />
                <span className="text-xs font-bold shrink-0">{currentUser?.username ?? 'User'}</span>
                <span className="rounded bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 border border-border">
                  {selectedBranch ?? 'Goa'}
                </span>
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            side="right" 
            sideOffset={12} 
            className={cn(
              "w-64 border-border bg-popover shadow-xl animate-in slide-in-from-left-2 duration-200",
              isDarkSidebar && "dark bg-slate-900 text-slate-50 border-slate-800"
            )}
          >
            <DropdownMenuLabel className="px-3 py-2 space-y-1">
              <p className="text-sm font-bold tracking-tight">{dayGreeting}, {currentUser?.username ?? 'User'}!</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{selectedBranch ?? 'Goa'} Branch Office</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={dispatchOpenShortcutGuide} className="cursor-pointer gap-2 py-2">
              <UserCog className="size-4 opacity-70" />
              <span className="text-xs font-medium">Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={dispatchOpenSettings} className="cursor-pointer gap-2 py-2">
              <SlidersHorizontal className="size-4 opacity-70" />
              <span className="text-xs font-medium">System Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 cursor-pointer gap-2 py-2">
              <LogOut className="size-4" />
              <span className="text-xs font-bold">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </aside>
  )
}