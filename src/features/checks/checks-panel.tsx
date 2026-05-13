import * as React from 'react'
import { Pencil, Trash2, GripVertical, Undo2, Redo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput, FloatingSelect, FloatingNumberInput, FloatingDatePicker } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'
import { usePosStore } from '@/state/pos-store'
import type { CheckEntry, CheckType } from '@/types/pos'
import { formatCurrency, parseMoney } from '@/lib/money'
import { summarizeChecks } from '@/features/sidebar/calculations'
import { kb } from '@/lib/keyboard-hints'

const checkTypes: CheckType[] = ['Bank Check', 'Bank Transfer', 'GCash', 'Other E-Wallet']

type Draft = { type: CheckType; bank: string; account: string; checkNo: string; receipt: string; date: string; amount: string }
const defaultDraft: Draft = { type: 'Bank Check', bank: '', account: '', checkNo: '', receipt: '', date: '', amount: '' }

export function ChecksPanel() {
  const { checks, setChecks, pushHistory, undo, redo, canUndo, canRedo } = usePosStore()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)
  const totals = summarizeChecks(checks)

  const reset = () => { setEditingId(null); setDraft(defaultDraft) }

  function onSave() {
    const amount = parseMoney(draft.amount)
    if (!draft.bank.trim() || amount <= 0) return
    pushHistory('checks')
    const entry: CheckEntry = {
      id: editingId ?? Date.now().toString(),
      type: draft.type,
      bank: draft.bank,
      account: draft.account || '',
      checkNo: draft.checkNo || '',
      receipt: draft.receipt || '',
      date: draft.date || '',
      amount,
    }
    setChecks((prev) => editingId ? prev.map((x) => (x.id === editingId ? entry : x)) : [...prev, entry])
    reset()
  }

  function onDelete(id: string) {
    pushHistory('checks')
    setChecks((prev) => prev.filter((row) => row.id !== id))
    if (editingId === id) reset()
  }

  function onEdit(item: CheckEntry) {
    setEditingId(item.id)
    setDraft({ type: item.type, bank: item.bank, account: item.account, checkNo: item.checkNo, receipt: item.receipt, date: item.date, amount: String(item.amount) })
  }

  function onDrop(type: CheckType, id: string) {
    pushHistory('checks')
    setChecks((prev) => prev.map((item) => (item.id === id ? { ...item, type } : item)))
  }

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-none bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">Check Payments</h2>
          <div className="flex items-center gap-2">
            <ActionTooltip label="Undo" shortcut={kb.undo()}>
              <Button type="button" variant="outline" size="icon-sm" aria-label="Undo" onClick={() => undo('checks')} disabled={!canUndo('checks')}>
                <Undo2 className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Redo" shortcut={kb.redo()}>
              <Button type="button" variant="outline" size="icon-sm" aria-label="Redo" onClick={() => redo('checks')} disabled={!canRedo('checks')}>
                <Redo2 className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Clear all check rows">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { pushHistory('checks'); setChecks([]); reset() }}
                disabled={checks.length === 0}
              >
                Clear All
              </Button>
            </ActionTooltip>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead><TableHead>Bank/Branch</TableHead><TableHead>Account</TableHead><TableHead>Ref No.</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            {checkTypes.map((type) => {
              const rows = checks.filter((row) => row.type === type)
              if (!rows.length) return null
              return (
                <TableBody key={type} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData('text/plain'); if (id) onDrop(type, id) }}>
                  <TableRow className="bg-muted/40"><TableCell colSpan={6} className="font-semibold">{type}</TableCell></TableRow>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="group" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', row.id)}>
                      <TableCell className="w-[180px] max-w-[180px]">
                        <div className="flex items-center">
                          <GripVertical className="mr-2 shrink-0 size-3 text-muted-foreground" />
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate cursor-default block w-full text-left">{row.type}</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="max-w-[300px] whitespace-normal break-words">
                                {row.type}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell className="w-[180px] max-w-[180px]">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate cursor-default block w-full text-left">{row.bank}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-[300px] whitespace-normal break-words">
                              {row.bank}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{row.account || '-'}</TableCell>
                      <TableCell>{row.checkNo || '-'}</TableCell>
                      <TableCell>{row.date || '-'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <span>{formatCurrency(row.amount)}</span>
                          <span className="inline-flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="icon-xs" onClick={() => onEdit(row)}><Pencil className="size-3" /></Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => onDelete(row.id)}><Trash2 className="size-3" /></Button>
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
        <div className="flex flex-wrap gap-4 border-t px-3 py-2 text-xs">
          <span>Bank Check: {formatCurrency(totals.check)}</span>
          <span>Transfer: {formatCurrency(totals.transfer)}</span>
          <span>GCash: {formatCurrency(totals.gcash)}</span>
          <span>E-Wallet: {formatCurrency(totals.ewallet)}</span>
        </div>
      </section>

      <section className="shrink-0 space-y-3 rounded-none border-l bg-muted/20 p-3">
        <h3 className="text-sm font-semibold">{editingId ? 'Edit Payment' : 'Add Payment'}</h3>
        <FloatingSelect
          label="Type"
          value={draft.type}
          onValueChange={(v) => setDraft((s) => ({ ...s, type: v as CheckType }))}
          options={checkTypes.map((t) => ({ label: t, value: t }))}
        />
        <FloatingInput id="primary-input" label="Bank name - branch" value={draft.bank} onChange={(e) => setDraft((s) => ({ ...s, bank: e.target.value }))} />
        <FloatingInput label="Account name" value={draft.account} onChange={(e) => setDraft((s) => ({ ...s, account: e.target.value }))} />
        <FloatingInput label="Check/Reference no." value={draft.checkNo} onChange={(e) => setDraft((s) => ({ ...s, checkNo: e.target.value }))} />
        
        <div className="grid grid-cols-6 gap-2">
          <FloatingInput 
            label="Receipt no."
            containerClassName="col-span-3" 
            value={draft.receipt} 
            onChange={(e) => setDraft((s) => ({ ...s, receipt: e.target.value }))} 
          />
          <FloatingDatePicker label="Date" containerClassName="col-span-3 w-full" 
              value={draft.date} 
              onChange={(date) => setDraft((s) => ({ ...s, date }))} 
              placeholder="yyyy/mm/dd" 
            />
        </div>
        <FloatingNumberInput label="Amount" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft((s) => ({ ...s, amount: e.target.value }))} />
        <div className="grid grid-cols-3 gap-2">
          <ActionTooltip label={editingId ? 'Update row' : 'Save row'} shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
            <Button type="button" onClick={onSave}>{editingId ? 'Update' : 'Save'}</Button>
          </ActionTooltip>
          <ActionTooltip label="Cancel editing" shortcut={kb.cancel()}>
            <Button type="button" variant="outline" onClick={reset}>Cancel</Button>
          </ActionTooltip>
          <ActionTooltip label="Delete current row" shortcut={kb.deleteRow()}>
            <Button type="button" variant="destructive" onClick={() => editingId && onDelete(editingId)} disabled={!editingId}>
              Delete
            </Button>
          </ActionTooltip>
        </div>
      </section>
    </div>
  )
}



