/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'

import { parseMoney } from '@/lib/money'
import {
  initialChecks,
  initialExpenses,
  initialIncome,
  initialInstallments,
  initialSettings,
  initialSidebar,
  initialTab,
} from '@/state/seed'
import { firstTabInSection, sectionForTab } from '@/lib/nav-sections'
import type {
  AppSettings,
  CheckEntry,
  ExpenseEntry,
  FinancingEntry,
  IncomeEntry,
  InstallmentEntry,
  InventoryItem,
  NavSection,
  PaymentEntry,
  PosTab,
  SidebarState,
} from '@/types/pos'

type HistoryState<T> = { past: T[][]; future: T[][] }
const cloneList = <T,>(list: T[]): T[] => list.map((item) => ({ ...item }))

type DatasetKey = 'expenses' | 'checks' | 'income' | 'payments' | 'financing' | 'inventoryItems'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline'

type PosStoreValue = {
  syncStatus: SyncStatus
  setSyncStatus: React.Dispatch<React.SetStateAction<SyncStatus>>
  syncError: string | null
  setSyncError: React.Dispatch<React.SetStateAction<string | null>>
  lastSyncTime: Date | null
  setLastSyncTime: React.Dispatch<React.SetStateAction<Date | null>>
  activeTab: PosTab
  setActiveTab: (tab: PosTab) => void
  setActiveSection: (section: NavSection) => void
  currentDate: Date
  changeDate: (days: number) => void
  goToToday: () => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  settings: AppSettings
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>
  expenses: ExpenseEntry[]
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseEntry[]>>
  checks: CheckEntry[]
  setChecks: React.Dispatch<React.SetStateAction<CheckEntry[]>>
  income: IncomeEntry[]
  setIncome: React.Dispatch<React.SetStateAction<IncomeEntry[]>>
  payments: PaymentEntry[]
  setPayments: React.Dispatch<React.SetStateAction<PaymentEntry[]>>
  financing: FinancingEntry[]
  setFinancing: React.Dispatch<React.SetStateAction<FinancingEntry[]>>
  inventoryItems: InventoryItem[]
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>
  installments: InstallmentEntry[]
  setInstallments: React.Dispatch<React.SetStateAction<InstallmentEntry[]>>
  sidebar: SidebarState
  setSidebar: React.Dispatch<React.SetStateAction<SidebarState>>
  pushHistory: (key: DatasetKey, snapshot?: unknown[]) => void
  undo: (key: DatasetKey) => void
  redo: (key: DatasetKey) => void
  canUndo: (key: DatasetKey) => boolean
  canRedo: (key: DatasetKey) => boolean
  updateSidebarField: (key: keyof SidebarState, value: number) => void
  updateDeduction: (key: string, value: number) => void
  updateDenomination: (key: string, value: number) => void
}

const PosStoreContext = React.createContext<PosStoreValue | null>(null)

const LOCAL_STORAGE_KEY = 'pos-app-state-v2'

function loadSavedState<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return parsed[key] !== undefined ? parsed[key] : fallback
  } catch {
    return fallback
  }
}

export function PosStoreProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = React.useState<PosTab>(initialTab)
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>('idle')
  const [syncError, setSyncError] = React.useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null)
  
  const [settings, setSettings] = React.useState<AppSettings>(() => loadSavedState('settings', initialSettings))
  const [expenses, setExpenses] = React.useState<ExpenseEntry[]>(() => loadSavedState('expenses', initialExpenses))
  const [checks, setChecks] = React.useState<CheckEntry[]>(() => loadSavedState('checks', initialChecks))
  const [income, setIncome] = React.useState<IncomeEntry[]>(() => loadSavedState('income', initialIncome))
  const [payments, setPayments] = React.useState<PaymentEntry[]>(() => loadSavedState('payments', []))
  const [financing, setFinancing] = React.useState<FinancingEntry[]>(() => loadSavedState('financing', []))
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>(() => loadSavedState('inventoryItems', []))
  const [installments, setInstallments] = React.useState<InstallmentEntry[]>(() => loadSavedState('installments', initialInstallments))
  const [sidebar, setSidebar] = React.useState<SidebarState>(() => loadSavedState('sidebar', initialSidebar))

  const [history, setHistory] = React.useState<{
    expenses: HistoryState<ExpenseEntry>
    checks: HistoryState<CheckEntry>
    income: HistoryState<IncomeEntry>
    payments: HistoryState<PaymentEntry>
    financing: HistoryState<FinancingEntry>
    inventoryItems: HistoryState<InventoryItem>
  }>({ 
    expenses: { past: [], future: [] }, 
    checks: { past: [], future: [] }, 
    income: { past: [], future: [] },
    payments: { past: [], future: [] },
    financing: { past: [], future: [] },
    inventoryItems: { past: [], future: [] }
  })

  const changeDate = React.useCallback((days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + days)
      return next
    })
  }, [])

  React.useEffect(() => {
    const toSave = {
      settings,
      expenses,
      checks,
      income,
      payments,
      financing,
      inventoryItems,
      installments,
      sidebar,
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave))
  }, [settings, expenses, checks, income, payments, financing, inventoryItems, installments, sidebar])

  const goToToday = React.useCallback(() => setCurrentDate(new Date()), [])

  const setActiveSection = React.useCallback((section: NavSection) => {
    setActiveTab((current) => {
      if (sectionForTab(current) === section) return current
      return firstTabInSection(section)
    })
  }, [])

  const currentMap = React.useMemo(() => ({ expenses, checks, income, payments, financing, inventoryItems }), [checks, expenses, income, payments, financing, inventoryItems])

  const pushHistory = React.useCallback(
    (key: DatasetKey, snapshot?: unknown[]) => {
      const base = (snapshot as unknown[] | undefined) ?? currentMap[key]
      setHistory((prev) => ({
        ...prev,
        [key]: {
          past: [...prev[key].past, cloneList(base as never[])],
          future: [],
        },
      }))
    },
    [currentMap],
  )

  const undo = React.useCallback(
    (key: DatasetKey) => {
      setHistory((prev) => {
        const state = prev[key]
        if (!state.past.length) return prev

        const previous = state.past[state.past.length - 1]
        const current = cloneList(currentMap[key] as never[])

        if (key === 'expenses') setExpenses(cloneList(previous as ExpenseEntry[]))
        if (key === 'checks') setChecks(cloneList(previous as CheckEntry[]))
        if (key === 'income') setIncome(cloneList(previous as IncomeEntry[]))
        if (key === 'payments') setPayments(cloneList(previous as PaymentEntry[]))
        if (key === 'financing') setFinancing(cloneList(previous as FinancingEntry[]))
        if (key === 'inventoryItems') setInventoryItems(cloneList(previous as InventoryItem[]))

        return {
          ...prev,
          [key]: { past: state.past.slice(0, -1), future: [...state.future, current as never[]] },
        }
      })
    },
    [currentMap],
  )

  const redo = React.useCallback(
    (key: DatasetKey) => {
      setHistory((prev) => {
        const state = prev[key]
        if (!state.future.length) return prev

        const next = state.future[state.future.length - 1]
        const current = cloneList(currentMap[key] as never[])

        if (key === 'expenses') setExpenses(cloneList(next as ExpenseEntry[]))
        if (key === 'checks') setChecks(cloneList(next as CheckEntry[]))
        if (key === 'income') setIncome(cloneList(next as IncomeEntry[]))
        if (key === 'payments') setPayments(cloneList(next as PaymentEntry[]))
        if (key === 'financing') setFinancing(cloneList(next as FinancingEntry[]))
        if (key === 'inventoryItems') setInventoryItems(cloneList(next as InventoryItem[]))

        return {
          ...prev,
          [key]: { past: [...state.past, current as never[]], future: state.future.slice(0, -1) },
        }
      })
    },
    [currentMap],
  )

  const canUndo = React.useCallback((key: DatasetKey) => history[key].past.length > 0, [history])
  const canRedo = React.useCallback((key: DatasetKey) => history[key].future.length > 0, [history])

  const updateSidebarField = React.useCallback((key: keyof SidebarState, value: number) => {
    setSidebar((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateDeduction = React.useCallback((key: string, value: number) => {
    setSidebar((prev) => ({ ...prev, deductions: { ...prev.deductions, [key]: parseMoney(value) } }))
  }, [])

  const updateDenomination = React.useCallback((key: string, value: number) => {
    setSidebar((prev) => ({
      ...prev,
      denominationQuantities: { ...prev.denominationQuantities, [key]: Math.max(0, Math.floor(parseMoney(value))) },
    }))
  }, [])

  const value = React.useMemo<PosStoreValue>(
    () => ({
      syncStatus,
      setSyncStatus,
      syncError,
      setSyncError,
      lastSyncTime,
      setLastSyncTime,
      activeTab,
      setActiveTab,
      setActiveSection,
      currentDate,
      changeDate,
      goToToday,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      settings,
      setSettings,
      expenses,
      setExpenses,
      checks,
      setChecks,
      income,
      setIncome,
      payments,
      setPayments,
      financing,
      setFinancing,
      inventoryItems,
      setInventoryItems,
      installments,
      setInstallments,
      sidebar,
      setSidebar,
      pushHistory,
      undo,
      redo,
      canUndo,
      canRedo,
      updateSidebarField,
      updateDeduction,
      updateDenomination,
    }),
    [
      syncStatus,
      syncError,
      lastSyncTime,
      activeTab,
      setActiveTab,
      setActiveSection,
      changeDate,
      checks,
      currentDate,
      expenses,
      goToToday,
      income,
      payments,
      financing,
      inventoryItems,
      installments,
      mobileSidebarOpen,
      settings,
      sidebar,
      pushHistory,
      undo,
      redo,
      canUndo,
      canRedo,
      updateSidebarField,
      updateDeduction,
      updateDenomination,
    ],
  )

  return <PosStoreContext.Provider value={value}>{children}</PosStoreContext.Provider>
}

export function usePosStore() {
  const ctx = React.useContext(PosStoreContext)
  if (!ctx) throw new Error('usePosStore must be used inside PosStoreProvider')
  return ctx
}

