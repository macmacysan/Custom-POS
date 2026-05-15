import * as React from 'react'
import { Pencil, Trash2, GripVertical, Undo2, Redo2, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput, FloatingSelect, FloatingNumberInput, FloatingDatePicker } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'
import { usePosStore } from '@/state/pos-store'
import type { IncomeEntry, IncomeType } from '@/types/pos'
import { formatCurrency, parseMoney } from '@/lib/money'
import { summarizeIncome } from '@/features/sidebar/calculations'
import { kb } from '@/lib/keyboard-hints'
import { cn } from '@/lib/utils'

const incomeTypes: IncomeType[] = ['Load', 'Cash Reimbursement', 'Others']

// Per-type accent: left-border color + subtle tints
const typeAccent: Record<IncomeType, { border: string; badge: string; header: string; dot: string }> = {
  Load: {
    border: 'border-l-blue-500/60',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    header: 'bg-blue-500/5 text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500/70',
  },
  'Cash Reimbursement': {
    border: 'border-l-emerald-500/60',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    header: 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500/70',
  },
  Others: {
    border: 'border-l-violet-500/60',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    header: 'bg-violet-500/5 text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500/70',
  },
}

type Draft = { particular: IncomeType; remarks: string; receipt: string; date: string; amount: string }
const defaultDraft: Draft = { particular: 'Load', remarks: '', receipt: '', date: '', amount: '' }

export function IncomePanel() {
  const { income, setIncome, pushHistory, undo, redo, canUndo, canRedo } = usePosStore()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)
  const totals = summarizeIncome(income)

  function reset() { setEditingId(null); setDraft(defaultDraft) }

  function onSave() {
    const amount = parseMoney(draft.amount)
    if (amount <= 0) return
    pushHistory('income')
    const entry: IncomeEntry = {
      id: editingId ?? Date.now().toString(),
      particular: draft.particular,
      remarks: draft.remarks,
      receipt: draft.receipt,
      date: draft.date,
      amount,
    }
    setIncome((prev) => (editingId ? prev.map((x) => (x.id === editingId ? entry : x)) : [...prev, entry]))
    reset()
  }

  function onDelete(id: string) {
    pushHistory('income')
    setIncome((prev) => prev.filter((row) => row.id !== id))
    if (editingId === id) reset()
  }

  function onEdit(item: IncomeEntry) {
    setEditingId(item.id)
    setDraft({
      particular: item.particular,
      remarks: item.remarks,
      receipt: item.receipt,
      date: item.date,
      amount: String(item.amount),
    })
  }

  function onDrop(particular: IncomeType, id: string) {
    pushHistory('income')
    setIncome((prev) => prev.map((item) => (item.id === id ? { ...item, particular } : item)))
  }

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  const isDirty = draft.remarks.trim().length > 0 || draft.amount.trim().length > 0
  const canSave = parseMoney(draft.amount) > 0

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_235px]">

      {/* ── Table section ── */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-card">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Other Income</h2>
          </div>
          <div className="flex items-center gap-0.5">
            {canUndo('income') && (
              <ActionTooltip label="Undo" shortcut={kb.undo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo"
                  onClick={() => undo('income')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {canRedo('income') && (
              <ActionTooltip label="Redo" shortcut={kb.redo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Redo"
                  onClick={() => redo('income')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Redo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {income.length > 0 && (
              <ActionTooltip label="Clear all rows from this tab">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    pushHistory('income')
                    setIncome([])
                    reset()
                  }}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                >
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
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-8">Particular / Remarks</TableHead>
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Receipt</TableHead>
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</TableHead>
                <TableHead className="text-right h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pr-0">Amount</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>

            {incomeTypes.map((type) => {
              const rows = income.filter((item) => item.particular === type)
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

                    {/* 1. Left Side (Spans Particular, Receipt, Date) */}
                    <TableCell colSpan={3} className="py-1 pl-3">
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
                      {/* Particular & Remarks */}
                      <TableCell className="w-64 py-0 pl-3 text-xs max-w-64">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="shrink-0 size-3 text-muted-foreground/25 cursor-grab active:cursor-grabbing" />
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block w-full text-left truncate cursor-default">
                                  {row.remarks || row.particular}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="whitespace-normal max-w-75 wrap-break-word">
                                <div className="font-semibold text-[10px] uppercase text-muted-foreground mb-0.5">{row.particular}</div>
                                {row.remarks || 'No remarks'}
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

                      {/* Date */}
                      <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                        {row.date || <span className="select-none text-muted-foreground/35"></span>}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-0 pr-0 text-right tabular-nums">
                        <span className="font-mono text-xs font-medium">{formatCurrency(row.amount)}</span>
                      </TableCell>

                      {/* Dedicated Actions Column (Only visible on hover) */}
                      <TableCell className="w-12 px-0 py-0">
                        <div className="flex items-center justify-end gap-px transition-opacity opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onEdit(row)}
                            className="w-5 h-5 text-muted-foreground/50 hover:text-foreground"
                          >
                            <Pencil className="size-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
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

            {income.length === 0 && (
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-10 text-xs text-center text-muted-foreground/55">
                    No income entries yet. Add your first record on the right panel.
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
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', typeAccent['Load'].dot)} />
              <span className="text-muted-foreground">Load</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.load)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', typeAccent['Cash Reimbursement'].dot)} />
              <span className="text-muted-foreground">Reimbursement</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.reimbursement)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', typeAccent['Others'].dot)} />
              <span className="text-muted-foreground">Others</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.others)}</span>
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Grand Total</span>
              <span className="font-light tabular-nums">{formatCurrency(totals.grand)}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Form panel ── */}
      <section
        className={cn(
          'flex flex-col border-l shrink-0 transition-colors duration-150',
          editingId ? 'bg-muted/20' : 'bg-muted/10',
        )}
      >
        {/* Panel header — signals mode */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 transition-colors',
            editingId ? 'bg-primary/5' : 'bg-transparent',
          )}
        >
          {editingId
            ? <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            : <PlusCircle className="size-3 text-muted-foreground/50 shrink-0" />
          }
          <h3 className={cn('text-sm font-semibold', editingId ? 'text-primary' : 'text-muted-foreground')}>
            {editingId ? 'Editing Income' : 'New Income Entry'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <FloatingSelect
            label="Particular"
            value={draft.particular}
            onValueChange={(v) => setDraft((s) => ({ ...s, particular: v as IncomeType }))}
            options={incomeTypes.map((t) => ({ label: t, value: t }))}
            triggerClassName="w-full text-left"
          />
          <FloatingInput
            id="primary-input"
            label="Remarks"
            value={draft.remarks}
            onChange={(e) => setDraft((s) => ({ ...s, remarks: e.target.value }))}
          />
          <div className="grid grid-cols-[1fr_100px] gap-1.5">
            <FloatingInput
              label="Receipt / Ref"
              value={draft.receipt}
              onChange={(e) => setDraft((s) => ({ ...s, receipt: e.target.value }))}
            />
            <FloatingDatePicker
              label="Date"
              value={draft.date}
              onChange={(date) => setDraft((s) => ({ ...s, date }))}
              placeholder="yyyy/mm/dd"
            />
          </div>
          <FloatingNumberInput
            label="Amount"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => setDraft((s) => ({ ...s, amount: e.target.value }))}
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

              {/* Delete — separated, full width */}
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