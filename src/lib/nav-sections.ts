import type { NavSection, PosTab } from '@/types/pos'

/** Maps workspace tab to undo/redo dataset (tabs without history are omitted). */
export const TAB_UNDO_DATASET: Partial<
  Record<PosTab, 'expenses' | 'checks' | 'income' | 'payments' | 'financing' | 'inventoryItems'>
> = {
  items: 'inventoryItems',
  expenses: 'expenses',
  checks: 'checks',
  income: 'income',
  payments: 'payments',
  financing: 'financing',
}

export const SECTION_ORDER: NavSection[] = ['inventory', 'sales', 'reports']

export const SECTION_LABELS: Record<NavSection, string> = {
  inventory: 'Inventory',
  sales: 'Sales',
  reports: 'Reports',
}

export const SECTION_TABS: Record<NavSection, { id: PosTab; label: string }[]> = {
  inventory: [
    { id: 'items', label: 'Items' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'checks', label: 'Checks' },
  ],
  sales: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'income', label: 'Income' },
    { id: 'payments', label: 'Payments' },
  ],
  reports: [
    { id: 'installment', label: 'Installments' },
    { id: 'financing', label: 'Financing' },
    { id: 'sync-debug', label: 'Sync Debug' },
  ],
}

const TAB_TO_SECTION: Record<PosTab, NavSection> = {
  items: 'inventory',
  expenses: 'inventory',
  checks: 'inventory',
  dashboard: 'sales',
  schedule: 'sales',
  income: 'sales',
  payments: 'sales',
  installment: 'reports',
  financing: 'reports',
  'sync-debug': 'reports',
}

export function sectionForTab(tab: PosTab): NavSection {
  return TAB_TO_SECTION[tab]
}

export function firstTabInSection(section: NavSection): PosTab {
  return SECTION_TABS[section][0].id
}

export function tabLabel(tab: PosTab): string {
  for (const tabs of Object.values(SECTION_TABS)) {
    const hit = tabs.find((t) => t.id === tab)
    if (hit) return hit.label
  }
  return tab
}

/** Sidebar order: Alt+1 … Alt+8 jump to these workspace tabs (see App global key handler). */
export const WORKSPACE_TAB_HOTKEYS: PosTab[] = [
  'items',
  'expenses',
  'checks',
  'dashboard',
  'schedule',
  'income',
  'payments',
  'installment',
  'financing',
  'sync-debug',
]

export function workspaceTabHotkeyDigit(tab: PosTab): number | undefined {
  const i = WORKSPACE_TAB_HOTKEYS.indexOf(tab)
  return i === -1 ? undefined : i + 1
}
