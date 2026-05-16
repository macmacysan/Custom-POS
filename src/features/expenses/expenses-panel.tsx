import * as React from 'react'
import { Pencil, Trash2, GripVertical, Undo2, Redo2, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput, FloatingSelect, FloatingNumberInput } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'
import { expenseCategories } from '@/state/seed'
import { usePosStore } from '@/state/pos-store'
import type { ExpenseEntry, ExpenseType, VatType } from '@/types/pos'
import { formatCurrency, parseMoney } from '@/lib/money'
import { summarizeExpenses } from '@/features/sidebar/calculations'
import { kb } from '@/lib/keyboard-hints'
import { cn } from '@/lib/utils'

const groups: ExpenseType[] = ['Company Expenses', 'Purchases', 'Drawings']

// Per-type accent: left-border color + subtle tints
const typeAccent: Record<ExpenseType, { border: string; badge: string; header: string }> = {
  'Company Expenses': {
    border: 'border-l-blue-500/60',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    header: 'bg-blue-500/5 text-blue-700 dark:text-blue-300',
  },
  Purchases: {
    border: 'border-l-violet-500/60',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    header: 'bg-violet-500/5 text-violet-700 dark:text-violet-300',
  },
  Drawings: {
    border: 'border-l-amber-500/60',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    header: 'bg-amber-500/5 text-amber-700 dark:text-amber-300',
  },
}

type Draft = {
  type: ExpenseType
  description: string
  receipt: string
  category: string
  vat: VatType
  amount: string
}

const defaultDraft: Draft = {
  type: 'Company Expenses',
  description: '',
  receipt: '',
  category: 'Others',
  vat: 'Non-Vat',
  amount: '',
}

export function ExpensesPanel() {
  const {
    expenses, setExpenses, pushHistory,
    undo, redo, canUndo, canRedo,
    settings, currentDate, selectedBranch,
    setSyncStatus, setSyncError, setLastSyncTime,
    addSyncLog,
  } = usePosStore()

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)
  const totals = summarizeExpenses(expenses)

  // -- Sync logic (unchanged) --
  type ExpenseSheetRow = {
    rowId: number
    branch: string
    syncDate: string
    type: string
    description: string
    receipt: string
    category: string
    vat: string
    amount: number
  }

  const formatForSheet = React.useCallback((): ExpenseSheetRow[] => {
    const dateStr = currentDate.toISOString().split('T')[0]
    return expenses.map((exp, index) => ({
      rowId: index + 1,
      branch: selectedBranch ?? '',
      syncDate: dateStr,
      type: exp.type,
      description: exp.description,
      receipt: exp.receipt,
      category: exp.category,
      vat: exp.vat,
      amount: exp.amount,
    }))
  }, [expenses, currentDate, selectedBranch])

  const syncToSheet = React.useCallback(async (overridePayload?: ExpenseSheetRow[]) => {
    const payload = overridePayload || formatForSheet()

    if (typeof window === 'undefined' || !window.electronAPI) {
      setSyncStatus('offline')
      setSyncError('Sync API unavailable')
      addSyncLog('Expenses', 'offline', 'Electron sync API unavailable')
      return
    }

    setSyncStatus('syncing'); setSyncError(null)
    try {
      addSyncLog('Expenses', 'syncing', `Starting sync for ${payload.length} rows`)
      const result = await window.electronAPI.syncToGSheet('Expenses', payload)

      if (result.success) {
        setSyncStatus('success'); setLastSyncTime(new Date())
        addSyncLog('Expenses', 'success', `Synced ${payload.length} rows successfully`, result)
      } else {
        const message = result.error || 'Sync failed'
        const status = /offline|network|enotfound|econnrefused|not connected/i.test(message) ? 'offline' : 'error'
        setSyncStatus(status)
        setSyncError(message)
        addSyncLog('Expenses', status, message, result)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? 'Unknown error during sync')
      const status = /offline|network|enotfound|econnrefused|not connected/i.test(message) ? 'offline' : 'error'
      setSyncStatus(status)
      setSyncError(message)
      addSyncLog('Expenses', status, message)
    }
  }, [formatForSheet, setSyncStatus, setSyncError, setLastSyncTime, addSyncLog])

  React.useEffect(() => {
    const timer = setInterval(() => syncToSheet(), 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [syncToSheet])

  function reset() { setEditingId(null); setDraft(defaultDraft) }

  function onEdit(item: ExpenseEntry) {
    setEditingId(item.id)
    setDraft({ type: item.type, description: item.description, receipt: item.receipt, category: item.category, vat: item.vat, amount: String(item.amount) })
  }

  function onSave() {
    const amount = parseMoney(draft.amount)
    if (!draft.description.trim() || amount <= 0) return
    pushHistory('expenses')
    const next: ExpenseEntry = {
      id: editingId ?? Date.now().toString(),
      type: draft.type, description: draft.description.trim(),
      receipt: draft.receipt.trim() || '', category: draft.category, vat: draft.vat, amount,
    }
    setExpenses((prev) => {
      const updated = editingId ? prev.map((e) => (e.id === editingId ? next : e)) : [...prev, next]
      const payload = updated.map((exp, i) => ({
        rowId: i + 1,
        branch: selectedBranch ?? '',
        syncDate: currentDate.toISOString().split('T')[0],
        type: exp.type,
        description: exp.description,
        receipt: exp.receipt,
        category: exp.category,
        vat: exp.vat,
        amount: exp.amount,
      }))
      setTimeout(() => syncToSheet(payload), 0)
      return updated
    })
    reset()
  }

  function onDelete(id: string) {
    pushHistory('expenses')
    setExpenses((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      const payload = updated.map((exp, i) => ({
        rowId: i + 1,
        branch: selectedBranch ?? '',
        syncDate: currentDate.toISOString().split('T')[0],
        type: exp.type,
        description: exp.description,
        receipt: exp.receipt,
        category: exp.category,
        vat: exp.vat,
        amount: exp.amount,
      }))
      setTimeout(() => syncToSheet(payload), 0)
      return updated
    })
    if (editingId === id) reset()
  }

  function clearAll() {
    if (expenses.length === 0) return
    pushHistory('expenses')
    setExpenses([])
    reset()
  }

  useFormShortcuts({ onSave, onReset: reset, onDelete: editingId ? () => onDelete(editingId) : undefined, hasEditingId: Boolean(editingId) })

  function onDrop(targetType: ExpenseType, id: string) {
    pushHistory('expenses')
    setExpenses((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, type: targetType } : row))
      const payload = updated.map((exp, i) => ({
        rowId: i + 1,
        branch: selectedBranch ?? '',
        syncDate: currentDate.toISOString().split('T')[0],
        type: exp.type,
        description: exp.description,
        receipt: exp.receipt,
        category: exp.category,
        vat: exp.vat,
        amount: exp.amount,
      }))
      setTimeout(() => syncToSheet(payload), 0)
      return updated
    })
  }

  const isDirty = draft.description.trim().length > 0
  const canSave = isDirty && parseMoney(draft.amount) > 0

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_235px]">

      {/* ── Table section ── */}
      <section className="flex flex-col w-full min-h-0 overflow-hidden bg-card">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Expenses, Purchases & Drawings</h2>
          </div>
          <div className="flex items-center gap-0.5">
            {canUndo('expenses') && (
              <ActionTooltip label="Undo" shortcut={kb.undo()}>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Undo" onClick={() => undo('expenses')} className="w-6 h-6 text-muted-foreground hover:text-foreground">
                  <Undo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {canRedo('expenses') && (
              <ActionTooltip label="Redo" shortcut={kb.redo()}>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Redo" onClick={() => redo('expenses')} className="w-6 h-6 text-muted-foreground hover:text-foreground">
                  <Redo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {expenses.length > 0 && (
              <ActionTooltip label="Clear all rows from this tab">
                <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/8">
                  Clear All
                </Button>
              </ActionTooltip>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 hover:bg-transparent border-border/60">
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-8">Description</TableHead>
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Receipt No.</TableHead>
                <TableHead className="w-28 h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Category</TableHead>
                {settings.showVatColumn && (
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">VAT</TableHead>
                )}
                <TableHead className="text-right h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pr-0">Amount</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>

            {groups.map((type) => {
              const rows = expenses.filter((item) => item.type === type)
              if (rows.length === 0) return null
              const accent = typeAccent[type]
              const groupTotal = rows.reduce((sum, r) => sum + r.amount, 0)

              return (
                <TableBody
                  key={type}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData('text/plain')
                    if (id) onDrop(type, id)
                  }}
                >
                  {/* Group header row */}
                  <TableRow className={cn('hover:bg-transparent border-none', accent.header)}>

                    {/* 1. Left Side (Spans Desc, Receipt, Category, and VAT) */}
                    <TableCell colSpan={settings.showVatColumn ? 4 : 3} className="py-1 pl-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[9px] font-bold uppercase tracking-widest px-1.5 py-px rounded-sm', accent.badge)}>
                          {type}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                          {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    </TableCell>

                    {/* 2. Subtotal Column (Locks strictly to the Amount column) */}
                    <TableCell className="py-1 pr-0 text-right">
                      <span className="text-[10px] font-semibold font-mono tabular-nums opacity-60">
                        {formatCurrency(groupTotal)}
                      </span>
                    </TableCell>

                    {/* 3. Action Spacer (Accounts for the hidden edit/delete column) */}
                    <TableCell className="w-10 py-1"></TableCell>

                  </TableRow>

                  {/* Data rows */}
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'group h-7 border-l-2 transition-colors',
                        accent.border,
                        editingId === row.id
                          ? 'bg-muted/50 border-l-primary'
                          : 'border-l-transparent hover:border-l-current',
                      )}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', row.id)}
                    >
                      {/* Description */}
                      <TableCell className="py-0 pl-3 text-xs w-52 max-w-52">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="shrink-0 size-3 text-muted-foreground/25 cursor-grab active:cursor-grabbing" />
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block w-full text-left truncate cursor-default">{row.description}</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="whitespace-normal max-w-75 wrap-break-word">
                                {row.description}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>

                      {/* Receipt */}
                      <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                        {row.receipt
                          ? <span className="bg-muted/50 rounded px-1 py-px text-[10px]">{row.receipt}</span>
                          : <span className="select-none text-muted-foreground/35"></span>
                        }
                      </TableCell>

                      {/* Category */}
                      <TableCell className="py-0 w-28 max-w-28">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block w-full text-[11px] text-muted-foreground truncate cursor-default">{row.category}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="whitespace-normal max-w-75 wrap-break-word">
                              {row.category}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* VAT */}
                      {settings.showVatColumn && (
                        <TableCell className="py-0">
                          <span className={cn(
                            'text-[9px] font-semibold px-1 py-px rounded-sm',
                            row.vat === 'Vat'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted/50 text-muted-foreground/60',
                          )}>
                            {row.vat === 'Vat' ? 'VAT' : 'NON'}
                          </span>
                        </TableCell>
                      )}

                      {/* UPDATED: Amount Column (No longer hidden on hover) */}
                      <TableCell className="py-0 pr-0 text-right tabular-nums">
                        <span className="font-mono text-xs font-medium">
                          {formatCurrency(row.amount)}
                        </span>
                      </TableCell>

                      {/* NEW: Dedicated Actions Column (Only visible on hover) */}
                      <TableCell className="w-12 px-0 py-0">
                        <div className="flex items-center justify-end gap-px transition-opacity opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost" size="icon-xs"
                            onClick={() => onEdit(row)}
                            className="w-5 h-5 text-muted-foreground/50 hover:text-foreground"
                          >
                            <Pencil className="size-2.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon-xs"
                            onClick={() => onDelete(row.id)}
                            className="w-5 h-5 text-muted-foreground/50 hover:text-destructive"
                          >
                            <Trash2 className="size-2.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )
            })}
            {expenses.length === 0 && (
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  {/* UPDATED: colSpan incremented by 1 */}
                  <TableCell
                    colSpan={settings.showVatColumn ? 6 : 5}
                    className="py-10 text-xs text-center text-muted-foreground/55"
                  >
                    No entries yet. Add your first expense on the right panel.
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>

        {/* Footer — ledger summary bar */}
        <div className="shrink-0 border-t bg-muted/20 px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70 shrink-0" />
              <span className="text-muted-foreground">Company</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.company)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500/70 shrink-0" />
              <span className="text-muted-foreground">Purchases</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.purchases)}</span>
            </span>
            {/* FIXED: Removed the inline comment that broke 'items-center' */}
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70 shrink-0" />
              <span className="text-muted-foreground">Drawings</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.drawings)}</span>
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Grand Total</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.grand)}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Form panel ── */}
      <section className={cn(
        'flex flex-col border-l shrink-0 transition-colors duration-150',
        editingId ? 'bg-muted/20' : 'bg-muted/10',
      )}>

        {/* Panel header — signals mode */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2.5  transition-colors',
          editingId ? 'bg-primary/5 ' : 'bg-transparent',
        )}>
          {editingId
            ? <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            : <PlusCircle className="size-3 text-muted-foreground/50 shrink-0" />
          }
          <h3 className={cn('text-sm font-semibold', editingId ? 'text-primary' : 'text-muted-foreground')}>
            {editingId ? 'Editing Entry' : 'New Entry'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <FloatingSelect
            label="Type"
            value={draft.type}
            onValueChange={(v) => setDraft((prev) => ({ ...prev, type: v as ExpenseType }))}
            options={groups.map((item) => ({ label: item, value: item }))}
            triggerClassName="w-full text-left"
          />
          <FloatingInput
            id="primary-input"
            label="Description"
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="grid grid-cols-[1fr_96px] gap-1.5">
            <FloatingInput
              label="Receipt No."
              value={draft.receipt}
              onChange={(e) => setDraft((prev) => ({ ...prev, receipt: e.target.value }))}
            />
            <FloatingSelect
              label="Vat"
              value={draft.vat}
              onValueChange={(v) => setDraft((prev) => ({ ...prev, vat: v as VatType }))}
              options={[{ label: 'VAT', value: 'Vat' }, { label: 'Non-VAT', value: 'Non-Vat' }]}
              triggerClassName="w-full text-left"
            />
          </div>
          <FloatingSelect
            label="Category"
            value={draft.category}
            onValueChange={(v) => setDraft((prev) => ({ ...prev, category: v }))}
            triggerClassName="w-full [&>span]:truncate text-left"
            options={expenseCategories.map((cat) => ({ label: cat, value: cat }))}
          />
          <FloatingNumberInput
            label="Amount"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => setDraft((prev) => ({ ...prev, amount: e.target.value }))}
          />

          {/* Action buttons — conditional visibility */}
          {(isDirty || editingId) && (
            <div className="pt-0.5 space-y-1.5">
              <div className="flex gap-1.5">
                {!editingId && canSave && (
                  <ActionTooltip label="Save row" shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
                    <Button type="button" onClick={onSave} className="flex-1 text-xs h-7">
                      Save Entry
                    </Button>
                  </ActionTooltip>
                )}
                {editingId && (
                  <ActionTooltip label="Update row" shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
                    <Button type="button" onClick={onSave} className="flex-1 text-xs h-7">
                      Update
                    </Button>
                  </ActionTooltip>
                )}
                {(editingId || isDirty) && (
                  <ActionTooltip label="Cancel" shortcut={kb.cancel()}>
                    <Button type="button" variant="outline" onClick={reset} className="px-3 text-xs h-7">
                      Cancel
                    </Button>
                  </ActionTooltip>
                )}
              </div>

              {/* Delete — separated, full width, outline-destructive so it's visible but not alarming */}
              {editingId && (
                <ActionTooltip label="Delete current row" shortcut={kb.deleteRow()}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onDelete(editingId)}
                    className="w-full text-xs transition-colors h-7 border-destructive/30 text-destructive/80 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="size-3 mr-1.5" />
                    Delete Entry
                  </Button>
                </ActionTooltip>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}