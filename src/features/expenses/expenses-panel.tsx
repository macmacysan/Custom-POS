import * as React from 'react'
import { Pencil, Trash2, GripVertical, Undo2, Redo2} from 'lucide-react'

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

const groups: ExpenseType[] = ['Company Expenses', 'Purchases', 'Drawings']

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
  vat: 'Vat',
  amount: '',
}

export function ExpensesPanel() {
  const { expenses, setExpenses, pushHistory, undo, redo, canUndo, canRedo, settings, currentDate, setSyncStatus, setSyncError, setLastSyncTime } = usePosStore()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)

  const totals = summarizeExpenses(expenses)

  // -- Google Sheets Sync Logic --
  // Format data to match Google Sheet columns: [Row ID, Date, Type, Description, Receipt, Category, VAT, Amount]
  const formatForSheet = React.useCallback(() => {
    // Current date formatted as YYYY-MM-DD or similar
    const dateStr = currentDate.toISOString().split('T')[0]
    
    return expenses.map((exp, index) => ({
      rowId: index + 1, // Col A: Number of rows ID
      date: dateStr,    // Col B: Current date as stated in Nav Bar
      type: exp.type,
      description: exp.description,
      receipt: exp.receipt,
      category: exp.category,
      vat: exp.vat,
      amount: exp.amount
    }))
  }, [expenses, currentDate])

  const syncToSheet = React.useCallback(async (overridePayload?: any[]) => {
    // Disable if not running in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (!navigator.onLine) {
        setSyncStatus('offline')
        setSyncError('No internet connection')
        return
      }

      setSyncStatus('syncing')
      setSyncError(null)

      try {
        const payload = overridePayload || formatForSheet()
        console.log('Syncing expenses to Google Sheets...', payload)
        await window.electronAPI.syncExpenses(payload)
        console.log('Sync complete!')
        setSyncStatus('success')
        setLastSyncTime(new Date())
      } catch (err: any) {
        console.error('Failed to sync to Google Sheets', err)
        setSyncStatus('error')
        setSyncError(err?.message || 'Unknown error during sync')
      }
    }
  }, [formatForSheet, setSyncStatus, setSyncError, setLastSyncTime])

  // 1. Temporary 5-minute sync timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      syncToSheet()
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(timer)
  }, [syncToSheet])

  function reset() {
    setEditingId(null)
    setDraft(defaultDraft)
  }

  function onEdit(item: ExpenseEntry) {
    setEditingId(item.id)
    setDraft({
      type: item.type,
      description: item.description,
      receipt: item.receipt,
      category: item.category,
      vat: item.vat,
      amount: String(item.amount),
    })
  }

  function onSave() {
    const amount = parseMoney(draft.amount)
    if (!draft.description.trim() || amount <= 0) return

    pushHistory('expenses')

    const next: ExpenseEntry = {
      id: editingId ?? Date.now().toString(),
      type: draft.type,
      description: draft.description.trim(),
      receipt: draft.receipt.trim() || '',
      category: draft.category,
      vat: draft.vat,
      amount,
    }

    setExpenses((prev) => {
      const updated = editingId ? prev.map((entry) => (entry.id === editingId ? next : entry)) : [...prev, next]
      // 2. Saved automatic (can be disabled later by removing this call)
      const payload = updated.map((exp, i) => ({
        rowId: i + 1, date: currentDate.toISOString().split('T')[0], type: exp.type, description: exp.description, receipt: exp.receipt, category: exp.category, vat: exp.vat, amount: exp.amount
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
        rowId: i + 1, date: currentDate.toISOString().split('T')[0], type: exp.type, description: exp.description, receipt: exp.receipt, category: exp.category, vat: exp.vat, amount: exp.amount
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

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  function onDrop(targetType: ExpenseType, id: string) {
    pushHistory('expenses')
    setExpenses((prev) => prev.map((row) => (row.id === id ? { ...row, type: targetType } : row)))
  }

  return (
<div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_220px]">

  {/* ── Main table section ── */}
  <section className="flex flex-col min-h-0 overflow-hidden rounded-none bg-card">

    {/* Header */}
    <div className="flex items-center justify-between px-3 py-1.5 border-b">
      <h2 className="text-xs font-semibold">Expenses, Purchases & Drawings</h2>
      <div className="flex items-center gap-1">
        <ActionTooltip label="Undo" shortcut={kb.undo()}>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Undo"
            onClick={() => undo('expenses')}
            disabled={!canUndo('expenses')}
          >
            <Undo2 className="size-3.5" />
          </Button>
        </ActionTooltip>
        <ActionTooltip label="Redo" shortcut={kb.redo()}>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Redo"
            onClick={() => redo('expenses')}
            disabled={!canRedo('expenses')}
          >
            <Redo2 className="size-3.5" />
          </Button>
        </ActionTooltip>
        {expenses.length > 0 && (
          <ActionTooltip label="Clear all rows from this tab">
            <Button type="button" variant="outline" size="sm" onClick={clearAll} className="px-2 text-xs h-7">
              Clear All
            </Button>
          </ActionTooltip>
        )}
      </div>
    </div>

    {/* Table */}
    <div className="flex-1 min-h-0 overflow-y-auto ">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-52 h-7 text-[10px]">Description</TableHead>
            <TableHead className="h-7 text-[10px]">Receipt No.</TableHead>
            <TableHead className="w-28 h-7 text-[10px]">Category</TableHead>
            {settings.showVatColumn ? <TableHead className="h-7 text-[10px]">VAT</TableHead> : null}
            <TableHead className="text-right h-7 text-[10px] pr-15">Amount</TableHead>
          </TableRow>
        </TableHeader>
        {groups.map((type) => {
          const rows = expenses.filter((item) => item.type === type)
          if (rows.length === 0) return null
          return (
            <TableBody
              key={type}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('text/plain')
                if (id) onDrop(type, id)
              }}
            >
              {/* Group header */}
              <TableRow className="h-5 text-blue-500 bg-muted/40">
                <TableCell
                  colSpan={settings.showVatColumn ? 5 : 4}
                  className="py-0.5 text-[10px] font-semibold"
                >
                  {type}
                </TableCell>
              </TableRow>

              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group h-7"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', row.id)}
                >
                  {/* Description */}
                  <TableCell className="w-[180px] max-w-[180px] py-0 text-xs">
                    <div className="flex items-center">
                      <GripVertical className="mr-1.5 shrink-0 size-3 text-muted-foreground" />
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block w-full text-left truncate cursor-default">{row.description}</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="start" className="max-w-[300px] whitespace-normal break-words">
                            {row.description}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>

                  {/* Receipt */}
                  <TableCell className="py-0 text-xs">{row.receipt || '-'}</TableCell>

                  {/* Category */}
                  <TableCell className="py-0 text-xs w-28 max-w-28">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block w-full text-left truncate cursor-default">{row.category}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-[300px] whitespace-normal break-words">
                          {row.category}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* VAT */}
                  {settings.showVatColumn
                    ? <TableCell className="py-0 text-xs">{row.vat === 'Vat' ? 'VAT' : 'NON'}</TableCell>
                    : null}

                  {/* Amount + actions */}
                  <TableCell className="py-0 text-xs text-right tabular-nums">
                    <div className="flex items-center justify-end gap-1">
                      <span>{formatCurrency(row.amount)}</span>
                      <span className="inline-flex gap-0.5 transition-opacity opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon-xs" onClick={() => onEdit(row)}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => onDelete(row.id)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )
        })}
      </Table>
    </div>

    {/* Footer totals */}
    <div className="flex flex-wrap items-center gap-3 px-3 py-1 text-[10px] border-t text-muted-foreground">
      <span>Company: <span className="font-medium text-foreground tabular-nums">{formatCurrency(totals.company)}</span></span>
      <span>Purchases: <span className="font-medium text-foreground tabular-nums">{formatCurrency(totals.purchases)}</span></span>
      <span>Drawings: <span className="font-medium text-foreground tabular-nums">{formatCurrency(totals.drawings)}</span></span>
      <span className="font-semibold text-foreground">Total: {formatCurrency(totals.grand)}</span>
    </div>
  </section>

  {/* ── Form panel ── */}
  <section className="px-2.5 py-2 border-l rounded-none shrink-0 bg-muted/20">
    <h3 className="mb-2 text-xs font-semibold">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
    <div className="space-y-2">

      {/* Type */}
      <FloatingSelect
        label="Type"
        value={draft.type}
        onValueChange={(v) => setDraft((prev) => ({ ...prev, type: v as ExpenseType }))}
        options={groups.map((item) => ({ label: item, value: item }))}
      />

      {/* Description */}
      <FloatingInput
        id="primary-input"
        label="Description"
        value={draft.description}
        onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
      />

      {/* Receipt No. + VAT */}
      <div className="grid grid-cols-[1fr_80px] gap-1.5">
        <FloatingInput
          label="Receipt No."
          value={draft.receipt}
          onChange={(e) => setDraft((prev) => ({ ...prev, receipt: e.target.value }))}
        />
        <FloatingSelect
          label="VAT"
          value={draft.vat}
          onValueChange={(v) => setDraft((prev) => ({ ...prev, vat: v as VatType }))}
          options={[{ label: 'VAT', value: 'Vat' }, { label: 'Non-VAT', value: 'Non-Vat' }]}
        />
      </div>

      {/* Category */}
      <FloatingSelect
        label="Category"
        value={draft.category}
        onValueChange={(v) => setDraft((prev) => ({ ...prev, category: v }))}
        triggerClassName="[&>span]:truncate text-left"
        options={expenseCategories.map((cat) => ({ label: cat, value: cat }))}
      />

      {/* Amount */}
      <FloatingNumberInput
        label="Amount"
        inputMode="decimal"
        value={draft.amount}
        onChange={(e) => setDraft((prev) => ({ ...prev, amount: e.target.value }))}
      />

      {/* Actions */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        <ActionTooltip label={editingId ? 'Update row' : 'Save row'} shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
          <Button type="button" onClick={onSave} className="text-xs h-7">
            {editingId ? 'Update' : 'Save'}
          </Button>
        </ActionTooltip>
        <ActionTooltip label="Cancel editing" shortcut={kb.cancel()}>
          <Button type="button" variant="outline" onClick={reset} className="text-xs h-7">
            Cancel
          </Button>
        </ActionTooltip>
        <ActionTooltip label="Delete current row" shortcut={kb.deleteRow()}>
          <Button
            type="button"
            variant="destructive"
            onClick={() => editingId && onDelete(editingId)}
            disabled={!editingId}
            className="text-xs h-7"
          >
            Delete
          </Button>
        </ActionTooltip>
      </div>
    </div>
  </section>

</div>
  )
}

