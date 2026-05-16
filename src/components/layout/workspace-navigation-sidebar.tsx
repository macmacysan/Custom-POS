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
  Activity,
} from "lucide-react"
import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  'sync-debug': Activity,
}

/* Section accent colours for left-bar indicator */
const sectionAccent: Record<NavSection, string> = {
  inventory: "before:bg-emerald-500",
  sales:     "before:bg-blue-500",
  reports:   "before:bg-violet-500",
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
    syncLogs,
    clearSyncLogs,
  } = usePosStore()

  const activeSection = sectionForTab(activeTab)
  const hour = new Date().getHours()
  const dayGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <Sidebar className={className}>

      {/* ── Header ── */}
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none data-[state=open]:bg-transparent hover:bg-transparent active:bg-transparent px-0"
            >
              {/* POS terminal badge */}
              <div className="flex items-center justify-center rounded size-8 shrink-0 bg-primary text-primary-foreground font-mono font-black text-[11px] tracking-tight shadow-md shadow-primary/30">
                POS
              </div>
              <div className="flex-1 min-w-0 leading-tight pl-0.5">
                <p className="text-[13px] font-bold tracking-tight truncate text-sidebar-foreground">
                  Cashiers Report
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/40 font-medium">
                  Nueva Camsur Home Furnishing
                </p>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent className="bg-sidebar">
        <SidebarGroup className="py-3">
          <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECTION_ORDER.map((section) => {
                const SectionIcon = sectionIcons[section]
                const isActiveSection = activeSection === section
                const tabs = SECTION_TABS[section]

                return (
                  <Collapsible
                    key={section}
                    asChild
                    open={isActiveSection}
                    onOpenChange={(next) => {
                      if (next && !isActiveSection) setActiveSection(section)
                    }}
                  >
                    <SidebarMenuItem>

                      {/* Section trigger */}
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={SECTION_LABELS[section]}
                          isActive={isActiveSection}
                          className={cn(
                            "font-semibold text-[11px] transition-all",
                            isActiveSection
                              ? "text-sidebar-foreground"
                              : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                          )}
                        >
                          <SectionIcon className={cn(
                            "size-3.5 shrink-0 transition-opacity",
                            isActiveSection ? "opacity-100 text-primary" : "opacity-50"
                          )} />
                          <span>{SECTION_LABELS[section]}</span>
                          {isActiveSection
                            ? <ChevronDown className="ml-auto size-3 shrink-0 opacity-30" />
                            : <ChevronRight className="ml-auto size-3 shrink-0 opacity-25" />
                          }
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      {/* Tab list */}
                      <CollapsibleContent>
                        <SidebarMenuSub className="ml-3 border-l border-sidebar-border/60 pl-2">
                          {tabs.map((item) => {
                            const TabIcon = tabIcons[item.id]
                            const isActive = activeTab === item.id
                            const digit = workspaceTabHotkeyDigit(item.id)

                            return (
                              <SidebarMenuSubItem key={item.id}>
                                <ActionTooltip
                                  label={item.label}
                                  shortcut={digit !== undefined ? kb.workspaceTab(digit) : undefined}
                                >
                                  <SidebarMenuSubButton
                                    isActive={isActive}
                                    onClick={() => {
                                      setActiveTab(item.id)
                                      onTabSelect?.()
                                    }}
                                    className={cn(
                                      "text-[11px] font-medium rounded transition-all",
                                      isActive
                                        ? "text-sidebar-foreground bg-sidebar-accent"
                                        : "text-sidebar-foreground/45 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                                    )}
                                  >
                                    <TabIcon className={cn(
                                      "size-3 shrink-0",
                                      isActive ? "text-primary opacity-100" : "opacity-40"
                                    )} />
                                    <span>{item.label}</span>
                                    {isActive && (
                                      <span className="ml-auto size-1 rounded-full bg-primary shrink-0" />
                                    )}
                                  </SidebarMenuSubButton>
                                </ActionTooltip>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>

                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Sync Debug Logs (Temp) ── */}
      <div className="mt-auto px-3 py-4 border-t border-sidebar-border/30 bg-sidebar-accent/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">
            Sync Debug
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('sync-debug')}
              className="text-[9px] text-primary hover:underline font-semibold"
            >
              Open Diagnostics
            </button>
            <button 
              onClick={clearSyncLogs}
              className="text-[9px] text-sidebar-foreground/40 hover:text-primary transition-colors font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
          {syncLogs.length === 0 ? (
            <p className="text-[9px] text-sidebar-foreground/20 italic text-center py-4">
              Waiting for activity...
            </p>
          ) : (
            syncLogs.map((log) => (
              <div key={log.id} className="text-[9px] border-l-2 border-sidebar-border/40 pl-2 py-0.5 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "font-bold uppercase tracking-tight",
                    log.status === 'success' ? 'text-emerald-500' :
                    log.status === 'error' ? 'text-red-500' :
                    'text-blue-400'
                  )}>
                    {log.sheetName}
                  </span>
                  <span className="text-[8px] text-sidebar-foreground/20">
                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-sidebar-foreground/60 leading-tight">
                  {log.message}
                </p>
                {log.details?.error && (
                  <p className="text-red-400/80 text-[8px] bg-red-400/5 px-1 py-0.5 rounded mt-1 font-mono">
                    {log.details.error}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded px-2 py-1.5 h-auto"
                >
                  {/* User avatar initials */}
                  <div className="flex items-center justify-center size-7 rounded bg-primary/15 text-primary font-bold text-[10px] shrink-0 border border-primary/20">
                    {(currentUser?.username ?? 'U').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex items-center flex-1 min-w-0 gap-1.5">
                    <span className="text-[11px] font-semibold truncate text-sidebar-foreground">
                      {currentUser?.username ?? 'User'}
                    </span>
                    <span className="rounded bg-sidebar-accent border border-sidebar-border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-sidebar-foreground/60 shrink-0">
                      {selectedBranch ?? 'GOA'}
                    </span>
                  </div>

                  {/* Sync status dot */}
                  <span className={cn(
                    "size-1.5 shrink-0 rounded-full transition-all",
                    syncStatus === 'success'  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
                    syncStatus === 'syncing'  ? 'bg-blue-400 animate-pulse' :
                    syncStatus === 'error'    ? 'bg-red-500' :
                    syncStatus === 'offline'  ? 'bg-amber-400' :
                    'bg-sidebar-foreground/20'
                  )} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={12}
                className="w-64 shadow-2xl border-border bg-popover"
              >
                <DropdownMenuLabel className="px-3 py-2.5 space-y-0.5">
                  <p className="text-sm font-bold tracking-tight">
                    {dayGreeting}, {currentUser?.username ?? 'User'}!
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    {selectedBranch ?? 'Goa'} Branch
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={dispatchOpenShortcutGuide} className="gap-2 py-2 cursor-pointer">
                  <UserCog className="size-4 opacity-70" />
                  <span className="text-xs font-medium">Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={dispatchOpenSettings} className="gap-2 py-2 cursor-pointer">
                  <SlidersHorizontal className="size-4 opacity-70" />
                  <span className="text-xs font-medium">System Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="gap-2 py-2 text-destructive cursor-pointer focus:text-destructive">
                  <LogOut className="size-4" />
                  <span className="text-xs font-semibold">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  )
}