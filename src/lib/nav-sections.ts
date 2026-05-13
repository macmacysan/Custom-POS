import type { NavSection, PosTab } from '@/types/pos'

export const SECTION_ORDER: NavSection[] = ['inventory', 'sales', 'reports']

export const SECTION_LABELS: Record<NavSection, string> = {
  inventory: 'Inventory',
  sales: 'Sales',
  reports: 'Reports',
}

export const SECTION_TABS: Record<NavSection, { id: PosTab; label: string }[]> = {
  inventory: [
    { id: 'expenses', label: 'Expenses' },
    { id: 'checks', label: 'Checks' },
  ],
  sales: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'income', label: 'Income' },
    { id: 'payments', label: 'Payments' },
  ],
  reports: [
    { id: 'installment', label: 'Installments' },
    { id: 'financing', label: 'Financing' },
  ],
}

const TAB_TO_SECTION: Record<PosTab, NavSection> = {
  expenses: 'inventory',
  checks: 'inventory',
  dashboard: 'sales',
  income: 'sales',
  payments: 'sales',
  installment: 'reports',
  financing: 'reports',
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
