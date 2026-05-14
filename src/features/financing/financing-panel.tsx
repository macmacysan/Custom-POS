import * as React from 'react'
import { Pencil, Trash2, Undo2, Redo2, PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput, FloatingSelect, FloatingNumberInput } from '@/components/ui/floating-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { usePosStore } from '@/state/pos-store'
import { formatCurrency, parseMoney } from '@/lib/money'
import type { FinanceType, FinancingEntry } from '@/types/pos'
import { kb } from '@/lib/keyboard-hints'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'
import { cn } from '@/lib/utils'

const financeGroups: FinanceType[] = [
  'Nueva',
  'Home Credit',
  'Salmon Credit',
  'Skyro',
]

const typeAccent: Record<FinanceType, { border: string; badge: string; header: string }> = {
  Nueva: {
    border: 'border-l-blue-500/60',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    header: 'bg-blue-500/5 text-blue-700 dark:text-blue-300',
  },
  'Home Credit': {
    border: 'border-l-emerald-500/60',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    header: 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
  },
  'Salmon Credit': {
    border: 'border-l-amber-500/60',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    header: 'bg-amber-500/5 text-amber-700 dark:text-amber-300',
  },
  Skyro: {
    border: 'border-l-violet-500/60',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    header: 'bg-violet-500/5 text-violet-700 dark:text-violet-300',
  },
}

const statusOptions = ['Pending', 'Approved', 'Declined'] as const

type Draft = {
  financeProvider: FinanceType
  applicantName: string
  contactNumber: string
  item: string
  loanAmount: string
  termMonths: string
  status: 'Pending' | 'Approved' | 'Declined'
  dateApplied: string
}

const defaultDraft: Draft = {
  financeProvider: 'Home Credit',
  applicantName: '',
  contactNumber: '',
  item: '',
  loanAmount: '',
  termMonths: '12',
  status: 'Pending',
  dateApplied: new Date().toISOString().split('T')[0],
}

export function FinancingPanel() {
  const {
    financing = [],
    setFinancing,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePosStore()

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)

  function reset() {
    setEditingId(null)
    setDraft({ ...defaultDraft, dateApplied: new Date().toISOString().split('T')[0] })
  }

  function onEdit(item: FinancingEntry) {
    setEditingId(item.id)
    setDraft({
      financeProvider: item.financeProvider,
      applicantName: item.applicantName,
      contactNumber: item.contactNumber,
      item: item.item,
      loanAmount: String(item.loanAmount),
      termMonths: String(item.termMonths),
      status: item.status,
      dateApplied: item.dateApplied,
    })
  }

  function onSave() {
    if (!draft.applicantName.trim()) return

    pushHistory('financing')

    const next: FinancingEntry = {
      id: editingId ?? Date.now().toString(),
      financeProvider: draft.financeProvider,
      applicantName: draft.applicantName,
      contactNumber: draft.contactNumber,
      item: draft.item,
      loanAmount: parseMoney(draft.loanAmount),
      termMonths: parseInt(draft.termMonths) || 12,
      status: draft.status,
      dateApplied: draft.dateApplied,
    }

    setFinancing((prev: FinancingEntry[]) =>
      editingId
        ? prev.map((p) => (p.id === editingId ? next : p))
        : [...prev, next],
    )

    reset()
  }

  function onDelete(id: string) {
    pushHistory('financing')
    setFinancing((prev: FinancingEntry[]) => prev.filter((p) => p.id !== id))
    if (editingId === id) reset()
  }

  function clearAll() {
    if (financing.length === 0) return
    pushHistory('financing')
    setFinancing([])
    reset()
  }

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  const isDirty = draft.applicantName.trim().length > 0 || draft.loanAmount.trim().length > 0
  const canSave = draft.applicantName.trim().length > 0

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_235px]">
      {/* ── Table section ── */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Financing Applications</h2>
          </div>
          <div className="flex items-center gap-0.5">
            {canUndo('financing') && (
              <ActionTooltip label="Undo" shortcut={kb.undo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo"
                  onClick={() => undo('financing')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {canRedo('financing') && (
              <ActionTooltip label="Redo" shortcut={kb.redo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Redo"
                  onClick={() => redo('financing')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Redo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {financing.length > 0 && (
              <ActionTooltip label="Clear all rows from this tab">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
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
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-3">Date Applied</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Applicant</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Contact</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Item</TableHead>
                <TableHead className="text-right h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Loan Amt</TableHead>
                <TableHead className="text-center h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Terms</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>

            {financeGroups.map((finance) => {
              const rows = financing.filter((f) => f.financeProvider === finance)
              if (rows.length === 0) return null
              const accent = typeAccent[finance]
              const approvedTotal = rows
                .filter((r) => r.status === 'Approved')
                .reduce((sum, r) => sum + r.loanAmount, 0)

              return (
                <TableBody key={finance}>
                  {/* Group header row */}
                  <TableRow className={cn('hover:bg-transparent border-none', accent.header)}>
                    <TableCell colSpan={4} className="py-1 pl-3">
                      <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] font-bold uppercase tracking-widest px-1.5 py-px rounded-sm', accent.badge)}>
                          {finance}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                          {rows.length} {rows.length === 1 ? 'application' : 'applications'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 text-right">
                      <span className="text-[10px] font-semibold font-mono tabular-nums opacity-60">
                        {formatCurrency(approvedTotal)}
                      </span>
                    </TableCell>
                    <TableCell colSpan={2} />
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
                    >
                      <TableCell className="py-0 pl-3 text-[11px] text-muted-foreground font-mono tabular-nums">
                        {row.dateApplied || '-'}
                      </TableCell>
                      <TableCell className="py-0 text-xs font-medium">
                        {row.applicantName}
                      </TableCell>
                      <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                        {row.contactNumber || '-'}
                      </TableCell>
                      <TableCell className="py-0 text-xs text-muted-foreground max-w-[150px] truncate">
                        {row.item}
                      </TableCell>
                      <TableCell className="py-0 text-right tabular-nums">
                        <span className="font-mono text-xs font-medium">{formatCurrency(row.loanAmount)}</span>
                      </TableCell>
                      <TableCell className="py-0 text-center text-[11px] font-mono tabular-nums">
                        {row.termMonths}m
                      </TableCell>
                      <TableCell className="py-0">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-px rounded-sm text-[10px] font-bold uppercase tracking-wider border border-transparent',
                            row.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                              : row.status === 'Declined'
                                ? 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
                          )}
                        >
                          {row.status}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="w-12 px-0 py-0">
                        <div className="flex items-center justify-end gap-px pr-2 transition-opacity opacity-0 group-hover:opacity-100">
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
            {financing.length === 0 && (
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-10 text-xs text-center text-muted-foreground/55">
                    No financing applications yet. Add your first record on the right panel.
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>

        {/* Footer — ledger summary bar */}
        <div className="shrink-0 border-t bg-muted/20 px-3 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium">TOTAL APPS</span>
                <span className="text-xs font-bold tabular-nums">{financing.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">APPROVED</span>
                <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {financing.filter((f) => f.status === 'Approved').length}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Approved Loan Total</span>
              <span className="text-base font-bold tabular-nums">
                {formatCurrency(
                  financing.filter((f) => f.status === 'Approved').reduce((sum, f) => sum + f.loanAmount, 0),
                )}
              </span>
            </div>
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
        {/* Panel header */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 transition-colors',
            editingId ? 'bg-primary/5 ' : 'bg-transparent',
          )}
        >
          {editingId ? (
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          ) : (
            <PlusCircle className="size-3 text-muted-foreground/50 shrink-0" />
          )}
          <h3 className={cn('text-sm font-semibold', editingId ? 'text-primary' : 'text-muted-foreground')}>
            {editingId ? 'Editing Application' : 'New Application'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <div className="grid grid-cols-2 gap-2">
            <FloatingSelect
              label="Provider"
              value={draft.financeProvider}
              onValueChange={(v) => setDraft((p) => ({ ...p, financeProvider: v as FinanceType }))}
              options={financeGroups.map((g) => ({ label: g, value: g }))}
              triggerClassName="w-full text-left"
            />
            <FloatingSelect
              label="Status"
              value={draft.status}
              onValueChange={(v) => setDraft((p) => ({ ...p, status: v as Draft['status'] }))}
              options={statusOptions.map((s) => ({ label: s, value: s }))}
              triggerClassName="w-full text-left"
            />
          </div>

          <FloatingInput
            id="primary-input"
            label="Applicant Name"
            value={draft.applicantName}
            onChange={(e) => setDraft((p) => ({ ...p, applicantName: e.target.value }))}
          />

          <FloatingInput
            label="Contact Number"
            value={draft.contactNumber}
            onChange={(e) => setDraft((p) => ({ ...p, contactNumber: e.target.value }))}
          />

          <FloatingInput
            label="Item description"
            value={draft.item}
            onChange={(e) => setDraft((p) => ({ ...p, item: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-2">
            <FloatingNumberInput
              label="Loan Amount"
              value={draft.loanAmount}
              onChange={(e) => setDraft((p) => ({ ...p, loanAmount: e.target.value }))}
            />
            <FloatingInput
              label="Terms (Months)"
              type="number"
              value={draft.termMonths}
              onChange={(e) => setDraft((p) => ({ ...p, termMonths: e.target.value }))}
            />
          </div>

          <FloatingInput
            label="Date Applied"
            type="date"
            value={draft.dateApplied}
            onChange={(e) => setDraft((p) => ({ ...p, dateApplied: e.target.value }))}
          />

          {(isDirty || editingId) && (
            <div className="pt-0.5 space-y-1.5">
              <div className="flex gap-1.5">
                {canSave && (
                  <ActionTooltip label={editingId ? 'Update application' : 'Save application'} shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
                    <Button type="button" onClick={onSave} className="flex-1 text-xs h-7">
                      {editingId ? 'Update' : 'Save Application'}
                    </Button>
                  </ActionTooltip>
                )}
                <ActionTooltip label="Cancel" shortcut={kb.cancel()}>
                  <Button type="button" variant="outline" onClick={reset} className="px-3 text-xs h-7">
                    Cancel
                  </Button>
                </ActionTooltip>
              </div>

              {editingId && (
                <ActionTooltip label="Delete application" shortcut={kb.deleteRow()}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onDelete(editingId)}
                    className="w-full text-xs transition-colors h-7 border-destructive/30 text-destructive/80 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="size-3 mr-1.5" />
                    Delete Application
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



