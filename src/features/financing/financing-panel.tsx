import * as React from 'react'
import { Pencil, Trash2, Undo2, Redo2 } from 'lucide-react'

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

const financeGroups: FinanceType[] = [
  'Nueva',
  'Home Credit',
  'Salmon Credit',
  'Skyro',
]

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

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_340px]">
      {/* TABLE */}
      <section className="flex flex-col overflow-hidden bg-card/60">
        <div className="flex items-center justify-between border-b p-3 bg-muted/20">
          <h2 className="text-sm font-semibold">Financing Applications</h2>
          <div className="flex gap-2">
            <ActionTooltip label="Undo" shortcut={kb.undo()}>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Undo"
                onClick={() => undo('financing')}
                disabled={!canUndo('financing')}
              >
                <Undo2 className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Redo" shortcut={kb.redo()}>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Redo"
                onClick={() => redo('financing')}
                disabled={!canRedo('financing')}
              >
                <Redo2 className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Clear all applications">
              <Button type="button" variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </ActionTooltip>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>DATE</TableHead>
                  <TableHead>PROVIDER</TableHead>
                  <TableHead>APPLICANT</TableHead>
                  <TableHead>CONTACT</TableHead>
                  <TableHead>ITEM</TableHead>
                  <TableHead className="text-right">LOAN AMT</TableHead>
                  <TableHead className="text-center">TERMS (MO)</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {financing.map((row: FinancingEntry) => (
                  <TableRow key={row.id} className="group transition-colors hover:bg-muted/50">
                    <TableCell>{row.dateApplied || '-'}</TableCell>
                    <TableCell className="font-medium">{row.financeProvider}</TableCell>
                    <TableCell>{row.applicantName || '-'}</TableCell>
                    <TableCell>{row.contactNumber || '-'}</TableCell>
                    <TableCell>{row.item || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.loanAmount)}</TableCell>
                    <TableCell className="text-center">{row.termMonths}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        row.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' :
                        row.status === 'Declined' ? 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400' :
                        'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="icon-xs" variant="ghost" onClick={() => onEdit(row)}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => onDelete(row.id)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {financing.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No financing applications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER TOTALS */}
          <div className="border-t bg-muted/30 p-3 backdrop-blur-sm">
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">TOTAL APPS</span>
                  <span className="font-semibold">{financing.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">APPROVED</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{financing.filter(f => f.status === 'Approved').length}</span>
                </div>
              </div>
              <div className="flex flex-col items-end font-bold">
                <span className="text-xs text-muted-foreground">TOTAL LOAN AMOUNT (APPROVED)</span>
                <span className="text-lg">
                  {formatCurrency(financing.filter(f => f.status === 'Approved').reduce((sum, f) => sum + f.loanAmount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="border-l bg-muted/10 p-4 shadow-[inset_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.02)]">
        <h3 className="mb-4 text-sm font-semibold">
          {editingId ? 'Edit Application' : 'New Application'}
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FloatingSelect
              label="Provider"
              value={draft.financeProvider}
              onValueChange={(v) => setDraft((p) => ({ ...p, financeProvider: v as FinanceType }))}
              options={financeGroups.map((g) => ({ label: g, value: g }))}
            />
            <FloatingSelect
              label="Status"
              value={draft.status}
              onValueChange={(v) => setDraft((p) => ({ ...p, status: v as Draft['status'] }))}
              options={statusOptions.map((s) => ({ label: s, value: s }))}
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

          <div className="grid grid-cols-2 gap-3">
            <FloatingNumberInput label="Loan Amount"
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

          <div className="grid grid-cols-3 gap-2 pt-4">
            <ActionTooltip label={editingId ? 'Update row' : 'Save row'} shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
              <Button type="button" onClick={onSave} className="font-semibold shadow-sm">
                {editingId ? 'Update' : 'Save'}
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Cancel editing" shortcut={kb.cancel()}>
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Delete current row" shortcut={kb.deleteRow()}>
              <Button
                type="button"
                variant="destructive"
                disabled={!editingId}
                onClick={() => editingId && onDelete(editingId)}
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
