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
import type {
  AppSettings,
  CheckEntry,
  ExpenseEntry,
  IncomeEntry,
  InstallmentEntry,
  PaymentEntry,
  PosTab,
  SidebarState,
} from '@/types/pos'

type HistoryState<T> = { past: T[][]; future: T[][] }
const cloneList = <T,>(list: T[]): T[] => list.map((item) => ({ ...item }))

type DatasetKey = 'expenses' | 'checks' | 'income' | 'payments'

type PosStoreValue = {
  activeTab: PosTab
  setActiveTab: (tab: PosTab) => void
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

export function PosStoreProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = React.useState<PosTab>(initialTab)
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  const [settings, setSettings] = React.useState<AppSettings>(initialSettings)
  const [expenses, setExpenses] = React.useState<ExpenseEntry[]>(initialExpenses)
  const [checks, setChecks] = React.useState<CheckEntry[]>(initialChecks)
  const [income, setIncome] = React.useState<IncomeEntry[]>(initialIncome)
  const [payments, setPayments] = React.useState<PaymentEntry[]>([])
  const [installments, setInstallments] = React.useState<InstallmentEntry[]>(initialInstallments)
  const [sidebar, setSidebar] = React.useState<SidebarState>(initialSidebar)

  const [history, setHistory] = React.useState<{
    expenses: HistoryState<ExpenseEntry>
    checks: HistoryState<CheckEntry>
    income: HistoryState<IncomeEntry>
    payments: HistoryState<PaymentEntry>
  }>({ 
    expenses: { past: [], future: [] }, 
    checks: { past: [], future: [] }, 
    income: { past: [], future: [] },
    payments: { past: [], future: [] } 
  })

  const changeDate = React.useCallback((days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + days)
      return next
    })
  }, [])

  const goToToday = React.useCallback(() => setCurrentDate(new Date()), [])

  const currentMap = React.useMemo(() => ({ expenses, checks, income, payments }), [checks, expenses, income, payments])

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
      activeTab,
      setActiveTab,
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
      activeTab,
      changeDate,
      checks,
      currentDate,
      expenses,
      goToToday,
      income,
      payments,
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

