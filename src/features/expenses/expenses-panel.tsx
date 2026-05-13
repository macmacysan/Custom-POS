import * as React from 'react'
import { Pencil, Trash2, GripVertical, Undo2, Redo2} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FloatingInput, FloatingSelect, FloatingNumberInput } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { expenseCategories } from '@/state/seed'
import { usePosStore } from '@/state/pos-store'
import type { ExpenseEntry, ExpenseType, VatType } from '@/types/pos'
import { formatCurrency, parseMoney } from '@/lib/money'
import { summarizeExpenses } from '@/features/sidebar/calculations'

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
  const { expenses, setExpenses, pushHistory, undo, redo, canUndo, canRedo, settings } = usePosStore()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)

  const totals = summarizeExpenses(expenses)

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

    setExpenses((prev) =>
      editingId ? prev.map((entry) => (entry.id === editingId ? next : entry)) : [...prev, next],
    )
    reset()
  }

  function onDelete(id: string) {
    pushHistory('expenses')
    setExpenses((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) reset()
  }

  function clearAll() {
    if (expenses.length === 0) return
    pushHistory('expenses')
    setExpenses([])
    reset()
  }

  function onDrop(targetType: ExpenseType, id: string) {
    pushHistory('expenses')
    setExpenses((prev) => prev.map((row) => (row.id === id ? { ...row, type: targetType } : row)))
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-none bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">Expenses, Purchases & Drawings</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => undo('expenses')} disabled={!canUndo('expenses')}><Undo2 className="size-4" /></Button>
            <Button variant="outline" size="icon-sm" onClick={() => redo('expenses')} disabled={!canRedo('expenses')}><Redo2 className="size-4" /></Button>
            {expenses.length > 0 && <Button variant="outline" size="sm" onClick={clearAll} >Clear All</Button>}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-60">Description</TableHead>
                <TableHead>Receipt No.</TableHead>
                <TableHead className="w-32">Category</TableHead>
                {settings.showVatColumn ? <TableHead>VAT</TableHead> : null}
                <TableHead className="text-right">Amount</TableHead>
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
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={settings.showVatColumn ? 5 : 4} className="font-semibold">{type}</TableCell>
                  </TableRow>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="group" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', row.id)}>
                      <TableCell className="w-[180px] max-w-[180px]">
                        <div className="flex items-center">
                          <GripVertical className="mr-2 shrink-0 size-3 text-muted-foreground" />
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate cursor-default block w-full text-left">{row.description}</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="max-w-[300px] whitespace-normal break-words">
                                {row.description}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>{row.receipt || '-'}</TableCell>
                      <TableCell className="w-32 max-w-32">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate cursor-default block w-full text-left">{row.category}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-[300px] whitespace-normal break-words">
                              {row.category}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      {settings.showVatColumn ? <TableCell>{row.vat === 'Vat' ? 'VAT' : 'NON'}</TableCell> : null}
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

        <div className="flex flex-wrap items-center gap-4 border-t px-3 py-2 text-xs">
          <span>Company: {formatCurrency(totals.company)}</span>
          <span>Purchases: {formatCurrency(totals.purchases)}</span>
          <span>Drawings: {formatCurrency(totals.drawings)}</span>
          <span className="font-semibold">Total: {formatCurrency(totals.grand)}</span>
        </div>
      </section>

      <section className="shrink-0 rounded-none border-l bg-muted/20 p-3">
        <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
        <div className="space-y-3">
          
          {/* Row 1: Company Expenses (Type) */}
          <FloatingSelect
            label="Type"
            value={draft.type}
            onValueChange={(v) => setDraft((prev) => ({ ...prev, type: v as ExpenseType }))}
            options={groups.map((item) => ({ label: item, value: item }))}
          />

          {/* Row 2: Description */}
          <FloatingInput label="Description" value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} />

          {/* Row 3: Receipt No. and VAT */}
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <FloatingInput label="Receipt No." value={draft.receipt} onChange={(e) => setDraft((prev) => ({ ...prev, receipt: e.target.value }))} />
            <FloatingSelect
              label="VAT"
              value={draft.vat}
              onValueChange={(v) => setDraft((prev) => ({ ...prev, vat: v as VatType }))}
              options={[{ label: 'VAT', value: 'Vat' }, { label: 'Non-VAT', value: 'Non-Vat' }]}
            />
          </div>

          {/* Row 4: Category */}
          <FloatingSelect
            label="Category"
            value={draft.category}
            onValueChange={(v) => setDraft((prev) => ({ ...prev, category: v }))}
            triggerClassName="[&>span]:truncate text-left"
            options={expenseCategories.map((cat) => ({ label: cat, value: cat }))}
          />

          {/* Row 5: Amount */}
          <FloatingNumberInput label="Amount" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft((prev) => ({ ...prev, amount: e.target.value }))} />

          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button onClick={onSave}>{editingId ? 'Update' : 'Save'}</Button>
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button variant="destructive" onClick={() => editingId && onDelete(editingId)} disabled={!editingId}>Delete</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

