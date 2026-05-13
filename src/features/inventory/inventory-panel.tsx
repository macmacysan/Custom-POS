import * as React from 'react'
import { Pencil, Trash2, Undo2, Redo2, Plus, Minus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput, FloatingNumberInput } from '@/components/ui/floating-field'
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
import type { InventoryItem } from '@/types/pos'
import { kb } from '@/lib/keyboard-hints'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'

type Draft = {
  sku: string
  name: string
  stock: string
  price: string
}

const defaultDraft: Draft = {
  sku: '',
  name: '',
  stock: '',
  price: '',
}

export function InventoryPanel() {
  const {
    inventoryItems = [],
    setInventoryItems,
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
    setDraft(defaultDraft)
  }

  function onEdit(item: InventoryItem) {
    setEditingId(item.id)
    setDraft({
      sku: item.sku,
      name: item.name,
      stock: String(item.stock),
      price: String(item.price),
    })
  }

  function adjustStock(id: string, delta: number) {
    pushHistory('inventoryItems')
    setInventoryItems((prev: InventoryItem[]) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item,
      ),
    )
  }

  function onSave() {
    if (!draft.name.trim()) return

    pushHistory('inventoryItems')

    const next: InventoryItem = {
      id: editingId ?? Date.now().toString(),
      sku: draft.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
      name: draft.name,
      stock: parseInt(draft.stock) || 0,
      price: parseMoney(draft.price),
    }

    setInventoryItems((prev: InventoryItem[]) =>
      editingId
        ? prev.map((p) => (p.id === editingId ? next : p))
        : [...prev, next],
    )

    reset()
  }

  function onDelete(id: string) {
    pushHistory('inventoryItems')
    setInventoryItems((prev: InventoryItem[]) => prev.filter((p) => p.id !== id))
    if (editingId === id) reset()
  }

  function clearAll() {
    if (inventoryItems.length === 0) return
    pushHistory('inventoryItems')
    setInventoryItems([])
    reset()
  }

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_300px]">
      {/* TABLE */}
      <section className="flex flex-col overflow-hidden bg-card/60">
        <div className="flex items-center justify-between border-b p-3 bg-muted/20">
          <h2 className="text-sm font-semibold">Inventory Items</h2>
          <div className="flex gap-2">
            <ActionTooltip label="Undo" shortcut={kb.undo()}>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Undo"
                onClick={() => undo('inventoryItems')}
                disabled={!canUndo('inventoryItems')}
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
                onClick={() => redo('inventoryItems')}
                disabled={!canRedo('inventoryItems')}
              >
                <Redo2 className="size-4" />
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Clear all inventory rows">
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
                  <TableHead className="w-[120px]">SKU</TableHead>
                  <TableHead>ITEM NAME</TableHead>
                  <TableHead className="text-right">PRICE</TableHead>
                  <TableHead className="text-center w-[160px]">STOCK</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {inventoryItems.map((row: InventoryItem) => (
                  <TableRow key={row.id} className="group transition-colors hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.sku}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button size="icon-xs" variant="outline" className="h-6 w-6 rounded-full" onClick={() => adjustStock(row.id, -1)}>
                          <Minus className="size-3" />
                        </Button>
                        <span className={`w-8 text-center font-mono ${row.stock <= 5 ? 'text-red-500 font-bold' : ''}`}>
                          {row.stock}
                        </span>
                        <Button size="icon-xs" variant="outline" className="h-6 w-6 rounded-full" onClick={() => adjustStock(row.id, 1)}>
                          <Plus className="size-3" />
                        </Button>
                      </div>
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
                {inventoryItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No inventory items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER TOTALS */}
          <div className="border-t bg-muted/30 p-3 backdrop-blur-sm">
            <div className="flex justify-between items-center text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">UNIQUE ITEMS</span>
                <span className="font-semibold">{inventoryItems.length}</span>
              </div>
              <div className="flex flex-col items-end font-bold">
                <span className="text-xs text-muted-foreground">TOTAL STOCK VALUE</span>
                <span className="text-lg">
                  {formatCurrency(inventoryItems.reduce((sum, item) => sum + (item.price * item.stock), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="border-l bg-muted/10 p-4 shadow-[inset_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.02)]">
        <h3 className="mb-4 text-sm font-semibold">
          {editingId ? 'Edit Item' : 'New Item'}
        </h3>

        <div className="space-y-3">
          <FloatingInput
            label="SKU (Optional)"
            value={draft.sku}
            onChange={(e) => setDraft((p) => ({ ...p, sku: e.target.value }))}
          />

          <FloatingInput
            id="primary-input"
            label="Item Name"
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <FloatingNumberInput label="Price"
              value={draft.price}
              onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
            />
            <FloatingInput
              label="Stock Qty"
              type="number"
              value={draft.stock}
              onChange={(e) => setDraft((p) => ({ ...p, stock: e.target.value }))}
            />
          </div>

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
