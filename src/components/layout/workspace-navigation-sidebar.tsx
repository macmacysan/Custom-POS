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
    <Sidebar className={className}>

      {/* ── Header ── */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none data-[state=open]:bg-transparent hover:bg-transparent active:bg-transparent"
            >
              <div className="flex items-center justify-center border rounded shadow-sm size-7 shrink-0 border-border bg-foreground text-background">
                <span className="text-[10px] font-black leading-none">POS</span>
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-sm font-bold tracking-tight truncate text-sidebar-foreground">
                  Cashiers Report
                </p>
                <p className="truncate text-[10px] text-muted-foreground/70 font-medium">
                  Nueva Camsur Home Furnishing
                </p>
              </div>
              <ChevronsUpDown className="size-3 text-muted-foreground/30" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
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
                          className="font-semibold"
                        >
                          <SectionIcon className={cn("size-3.5 shrink-0 transition-opacity", isActiveSection ? "opacity-100" : "opacity-60")} />
                          <span>{SECTION_LABELS[section]}</span>
                          {isActiveSection
                            ? <ChevronDown className="ml-auto size-3 shrink-0 opacity-40" />
                            : <ChevronRight className="ml-auto size-3 shrink-0 opacity-40" />
                          }
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      {/* Tab list */}
                      <CollapsibleContent>
                        <SidebarMenuSub>
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
                                    className="font-medium"
                                  >
                                    <TabIcon className={cn("size-3 shrink-0 transition-opacity", isActive ? "opacity-100" : "opacity-60")} />
                                    <span>{item.label}</span>
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

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {/* Sync dot */}
                  <span className={cn(
                    "size-2 shrink-0 rounded-full",
                    syncStatus === 'success'  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                    syncStatus === 'syncing'  ? 'bg-blue-500 animate-pulse' :
                    syncStatus === 'error'    ? 'bg-red-500' :
                    syncStatus === 'offline'  ? 'bg-amber-500' :
                    'bg-muted-foreground/40'
                  )} />

                  <div className="flex items-center flex-1 min-w-0 gap-2">
                    <span className="text-xs font-bold truncate">{currentUser?.username ?? 'User'}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 border border-border shrink-0">
                      {selectedBranch ?? 'Goa'}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground/50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={12}
                className="w-64 shadow-xl animate-in slide-in-from-left-2 border-border bg-popover"
              >
                <DropdownMenuLabel className="px-3 py-2 space-y-1">
                  <p className="text-sm font-bold tracking-tight">
                    {dayGreeting}, {currentUser?.username ?? 'User'}!
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    {selectedBranch ?? 'Goa'} Branch Office
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
                <DropdownMenuItem onClick={logout} className="gap-2 py-2 text-red-500 cursor-pointer focus:text-red-500">
                  <LogOut className="size-4" />
                  <span className="text-xs font-bold">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  )
}