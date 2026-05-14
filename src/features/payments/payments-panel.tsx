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
import type { FinanceType, PaymentEntry } from '@/types/pos'
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

const paymentTypes = ['Downpayment', 'Payment', 'New Account'] as const
const termFrequencies = ['Daily', 'Weekly', 'Semi', 'Monthly'] as const
const paymentMethods = ['Cash', 'Gcash', 'Check', 'Online Payment'] as const
const monthlyTerms = Array.from({ length: 12 }, (_, i) => String(i + 1))

type Draft = {
  finance: FinanceType
  type: string
  termFrequency: string
  termValue: string
  date: string
  accountName: string
  qty: string
  item: string
  unitPrice: string
  grandTotal: string
  down: string
  balance: string
  cr: string
  lateFee: string
  paymentMethod: string
  notes: string
}

const defaultDraft: Draft = {
  finance: 'Nueva',
  type: '',
  termFrequency: '',
  termValue: '',
  date: '',
  accountName: '',
  qty: '',
  item: '',
  unitPrice: '',
  grandTotal: '',
  down: '',
  balance: '',
  cr: '',
  lateFee: '',
  paymentMethod: '',
  notes: '',
}

export function PaymentsPanel() {
  const {
    payments = [],
    setPayments,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePosStore()

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)

  const isPaymentType = draft.type === 'Payment'
  const isMonthlyTerm = draft.termFrequency === 'Monthly'

  function reset() {
    setEditingId(null)
    setDraft(defaultDraft)
  }

  function onEdit(item: PaymentEntry & { termFrequency?: string; termValue?: string }) {
    setEditingId(item.id)
    setDraft({
      finance: item.finance,
      type: item.type,
      termFrequency: item.termFrequency || '',
      termValue: item.termValue || '',
      date: item.date,
      accountName: item.accountName,
      qty: String(item.qty),
      item: item.item,
      unitPrice: String(item.unitPrice),
      grandTotal: String(item.grandTotal),
      down: String(item.down),
      balance: String(item.balance),
      cr: item.cr,
      lateFee: String(item.lateFee),
      paymentMethod: item.paymentMethod,
      notes: item.notes,
    })
  }

  function onSave() {
    if (!draft.accountName.trim()) return

    pushHistory('payments')

    const next: PaymentEntry & { termFrequency?: string; termValue?: string } = {
      id: editingId ?? Date.now().toString(),
      finance: draft.finance,
      type: draft.type,
      termFrequency: draft.termFrequency,
      termValue: draft.termValue,
      terms: `${draft.termFrequency} ${draft.termValue}`.trim(),
      date: draft.date,
      accountName: draft.accountName,
      qty: Number(draft.qty) || 0,
      item: draft.item,
      unitPrice: parseMoney(draft.unitPrice),
      grandTotal: parseMoney(draft.grandTotal),
      down: parseMoney(draft.down),
      balance: parseMoney(draft.balance),
      cr: draft.cr,
      lateFee: parseMoney(draft.lateFee),
      paymentMethod: draft.paymentMethod,
      notes: draft.notes,
    }

    setPayments((prev: PaymentEntry[]) =>
      editingId
        ? prev.map((p) => (p.id === editingId ? next : p))
        : [...prev, next],
    )

    reset()
  }

  function onDelete(id: string) {
    pushHistory('payments')
    setPayments((prev: PaymentEntry[]) =>
      prev.filter((p) => p.id !== id),
    )
    if (editingId === id) reset()
  }

  function clearAll() {
    if (payments.length === 0) return
    pushHistory('payments')
    setPayments([])
    reset()
  }

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  const isDirty = draft.accountName.trim().length > 0 || draft.grandTotal.trim().length > 0
  const canSave = draft.accountName.trim().length > 0

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_235px]">
      {/* ── Table section ── */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium tracking-tight">Payments Panel</h2>
          </div>
          <div className="flex items-center gap-0.5">
            {canUndo('payments') && (
              <ActionTooltip label="Undo" shortcut={kb.undo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo"
                  onClick={() => undo('payments')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {canRedo('payments') && (
              <ActionTooltip label="Redo" shortcut={kb.redo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Redo"
                  onClick={() => redo('payments')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Redo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {payments.length > 0 && (
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
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 hover:bg-transparent border-border/60">
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-3">Provider</TableHead>
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Type</TableHead>
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Terms</TableHead>
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</TableHead>
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Account</TableHead>
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Item</TableHead>
                  <TableHead className="text-right h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Total</TableHead>
                  <TableHead className="text-right h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Down</TableHead>
                  <TableHead className="text-right h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Balance</TableHead>
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">CR#</TableHead>
                  <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Method</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>

              {financeGroups.map((finance) => {
                const rows = payments.filter((p) => p.finance === finance)
                if (rows.length === 0) return null
                const accent = typeAccent[finance]
                const groupTotal = rows.reduce((sum, r) => sum + r.grandTotal, 0)

                return (
                  <TableBody key={finance}>
                    {/* Group header row */}
                    <TableRow className={cn('hover:bg-transparent border-none', accent.header)}>
                      <TableCell colSpan={6} className="py-1 pl-3">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[9px] font-bold uppercase tracking-widest px-1.5 py-px rounded-sm', accent.badge)}>
                            {finance}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        <span className="text-[10px] font-semibold font-mono tabular-nums opacity-60">
                          {formatCurrency(groupTotal)}
                        </span>
                      </TableCell>
                      <TableCell colSpan={4} />
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
                        <TableCell className="py-0 pl-3 text-xs">{row.finance}</TableCell>
                        <TableCell className="py-0 text-xs">
                          <span className="bg-muted/50 rounded px-1.5 py-px text-[10px]">{row.type}</span>
                        </TableCell>
                        <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                          {row.terms || '-'}
                        </TableCell>
                        <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                          {row.date || '-'}
                        </TableCell>
                        <TableCell className="py-0 text-xs max-w-[150px] truncate">
                          {row.accountName}
                        </TableCell>
                        <TableCell className="py-0 text-xs max-w-[150px] truncate text-muted-foreground">
                          {row.item}
                        </TableCell>
                        <TableCell className="py-0 text-right tabular-nums">
                          <span className="font-mono text-xs font-medium">{formatCurrency(row.grandTotal)}</span>
                        </TableCell>
                        <TableCell className="py-0 text-right tabular-nums text-muted-foreground/70">
                          <span className="font-mono text-[11px]">{formatCurrency(row.down)}</span>
                        </TableCell>
                        <TableCell className="py-0 text-right tabular-nums text-muted-foreground/70">
                          <span className="font-mono text-[11px]">{formatCurrency(row.balance)}</span>
                        </TableCell>
                        <TableCell className="py-0 text-[11px] font-mono">{row.cr || '-'}</TableCell>
                        <TableCell className="py-0 text-[11px] text-muted-foreground">{row.paymentMethod}</TableCell>

                        {/* Actions */}
                        <TableCell className="w-12 px-0 py-0">
                          <div className="flex items-center justify-end gap-px transition-opacity opacity-0 group-hover:opacity-100 pr-2">
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
              {payments.length === 0 && (
                <TableBody>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={12} className="py-10 text-xs text-center text-muted-foreground/55">
                      No payment entries yet. Add your first record on the right panel.
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>
        </div>

        {/* Footer — ledger summary bar */}
        <div className="shrink-0 border-t bg-muted/20 px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
            {financeGroups.map((finance) => {
              const total = payments
                .filter((p) => p.finance === finance)
                .reduce((sum, p) => sum + p.grandTotal, 0)
              const accent = typeAccent[finance]
              return (
                <span key={finance} className="flex items-center gap-1.5 text-[10px]">
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', accent.badge.split(' ')[0].replace('bg-', 'bg-').replace('/10', '/70'))} />
                  <span className="text-muted-foreground">{finance}</span>
                  <span className="font-light tabular-nums">{formatCurrency(total)}</span>
                </span>
              )
            })}
            <span className="ml-auto flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground font-semibold">Grand Total</span>
              <span className="font-bold tabular-nums text-xs">
                {formatCurrency(payments.reduce((sum, p) => sum + p.grandTotal, 0))}
              </span>
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
          <h3 className={cn('text-xs font-semibold', editingId ? 'text-primary' : 'text-muted-foreground')}>
            {editingId ? 'Editing Payment' : 'New Payment'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <div className="grid grid-cols-2 gap-2">
            <FloatingSelect
              label="Finance"
              value={draft.finance}
              onValueChange={(v) => setDraft((p) => ({ ...p, finance: v as FinanceType }))}
              options={financeGroups.map((g) => ({ label: g, value: g }))}
              triggerClassName="w-full text-left"
            />
            <FloatingSelect
              label="Type"
              value={draft.type}
              onValueChange={(v) => setDraft((p) => ({ ...p, type: v }))}
              options={paymentTypes.map((t) => ({ label: t, value: t }))}
              triggerClassName="w-full text-left"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FloatingSelect
              label="Frequency"
              value={draft.termFrequency}
              onValueChange={(v) => setDraft((p) => ({ ...p, termFrequency: v, termValue: '' }))}
              disabled={isPaymentType}
              options={termFrequencies.map((t) => ({ label: t, value: t }))}
              triggerClassName="w-full text-left"
            />
            {isMonthlyTerm ? (
              <FloatingSelect
                label="Months"
                value={draft.termValue}
                onValueChange={(v) => setDraft((p) => ({ ...p, termValue: v }))}
                disabled={isPaymentType}
                options={monthlyTerms.map((t) => ({ label: t, value: t }))}
                triggerClassName="w-full text-left"
              />
            ) : (
              <FloatingInput
                label="Value"
                value={draft.termValue}
                onChange={(e) => setDraft((p) => ({ ...p, termValue: e.target.value }))}
                disabled={isPaymentType || !draft.termFrequency}
              />
            )}
          </div>

          <FloatingInput
            label="Date"
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
          />

          <FloatingInput
            id="primary-input"
            label="Account Name"
            value={draft.accountName}
            onChange={(e) => setDraft((p) => ({ ...p, accountName: e.target.value }))}
          />

          <div className="grid grid-cols-4 gap-2">
            <FloatingInput
              label="Qty"
              containerClassName="col-span-1"
              value={draft.qty}
              onChange={(e) => setDraft((p) => ({ ...p, qty: e.target.value }))}
              disabled={isPaymentType}
            />
            <FloatingInput
              label="Item"
              containerClassName="col-span-3"
              value={draft.item}
              onChange={(e) => setDraft((p) => ({ ...p, item: e.target.value }))}
              disabled={isPaymentType}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FloatingNumberInput
              label="Unit Price"
              value={draft.unitPrice}
              onChange={(e) => setDraft((p) => ({ ...p, unitPrice: e.target.value }))}
              disabled={isPaymentType}
            />
            <FloatingNumberInput
              label="Grand Total"
              value={draft.grandTotal}
              onChange={(e) => setDraft((p) => ({ ...p, grandTotal: e.target.value }))}
              disabled={isPaymentType}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FloatingNumberInput
              label="Down Payment"
              value={draft.down}
              onChange={(e) => setDraft((p) => ({ ...p, down: e.target.value }))}
            />
            <FloatingNumberInput
              label="Balance"
              value={draft.balance}
              onChange={(e) => setDraft((p) => ({ ...p, balance: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FloatingInput
              label="CR#"
              value={draft.cr}
              onChange={(e) => setDraft((p) => ({ ...p, cr: e.target.value }))}
            />
            <FloatingNumberInput
              label="Late Fee"
              value={draft.lateFee}
              onChange={(e) => setDraft((p) => ({ ...p, lateFee: e.target.value }))}
              disabled={!isPaymentType}
            />
          </div>

          <FloatingSelect
            label="Method"
            value={draft.paymentMethod}
            onValueChange={(v) => setDraft((p) => ({ ...p, paymentMethod: v }))}
            options={paymentMethods.map((m) => ({ label: m, value: m }))}
            triggerClassName="w-full text-left"
          />

          <FloatingInput
            label="Notes"
            value={draft.notes}
            onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
          />

          {(isDirty || editingId) && (
            <div className="pt-0.5 space-y-1.5">
              <div className="flex gap-1.5">
                {canSave && (
                  <ActionTooltip label={editingId ? 'Update row' : 'Save row'} shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
                    <Button type="button" onClick={onSave} className="flex-1 text-xs h-7">
                      {editingId ? 'Update' : 'Save Entry'}
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