import * as React from 'react'
import { Pencil, Trash2, UserPlus, GripVertical, PlusCircle, ArrowLeft, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'
import { usePosStore } from '@/state/pos-store'
import type { InstallmentEntry } from '@/types/pos'
import { kb } from '@/lib/keyboard-hints'
import { cn } from '@/lib/utils'

const defaultDraft: Omit<InstallmentEntry, 'id' | 'added'> = {
  branch: 'GOA',
  lname: '',
  fname: '',
  mname: '',
  suffix: 'NONE',
  street: '',
  brgy: '',
  city: 'GOA',
  prov: 'CAMARINES SUR',
  occ: '',
  contact: '',
  agent: '',
  ref: '',
}

export function InstallmentPanel() {
  const { installments, setInstallments } = usePosStore()
  const [showForm, setShowForm] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')
  const [agentFilter, setAgentFilter] = React.useState('')
  const [draft, setDraft] = React.useState(defaultDraft)

  const filtered = installments.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch = `${item.lname} ${item.fname} ${item.contact}`.toLowerCase().includes(q)
    const matchAgent = !agentFilter || item.agent.toLowerCase().includes(agentFilter.toLowerCase())
    return matchSearch && matchAgent
  })

  function reset() {
    setEditingId(null)
    setDraft(defaultDraft)
  }

  function onEdit(item: InstallmentEntry) {
    setShowForm(true)
    setEditingId(item.id)
    setDraft({
      branch: item.branch,
      lname: item.lname,
      fname: item.fname,
      mname: item.mname,
      suffix: item.suffix,
      street: item.street,
      brgy: item.brgy,
      city: item.city,
      prov: item.prov,
      occ: item.occ,
      contact: item.contact,
      agent: item.agent,
      ref: item.ref,
    })
  }

  function onSave() {
    if (!draft.lname.trim() || !draft.fname.trim()) return
    const next: InstallmentEntry = {
      id: editingId ?? Date.now().toString(),
      ...draft,
      added: new Date().toISOString().slice(0, 10),
    }

    setInstallments((prev) =>
      editingId ? prev.map((item) => (item.id === editingId ? next : item)) : [...prev, next],
    )
    reset()
    setShowForm(false)
  }

  function onDelete(id: string) {
    setInstallments((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) reset()
  }

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  return showForm ? (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_235px]">
      {/* ── Table section ── */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Customer Database</h2>
          </div>
          <div className="flex items-center gap-1">
            <ActionTooltip label="Back to dashboard" shortcut={kb.cancel()}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-1 size-3" />
                Back
              </Button>
            </ActionTooltip>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute -translate-y-1/2 left-2 top-1/2 size-3 text-muted-foreground/50" />
            <FloatingInput
              label="Search name or contact"
              id="primary-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7"
            />
          </div>
          <FloatingInput
            label="Filter by agent"
            className="max-w-xs"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 hover:bg-transparent border-border/60">
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-8">Name</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Location</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Contact</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Agent</TableHead>
                <TableHead className="h-7 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Added</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="transition-colors border-l-2 group h-7 border-l-transparent hover:border-l-primary">
                  <TableCell className="py-0 pl-3">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="shrink-0 size-3 text-muted-foreground/25" />
                      <span className="text-xs font-medium">{item.lname}, {item.fname}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-0 text-[11px] text-muted-foreground">
                    {item.brgy}, {item.city}
                  </TableCell>
                  <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                    {item.contact || '-'}
                  </TableCell>
                  <TableCell className="py-0 text-[11px] text-muted-foreground">
                    {item.agent || '-'}
                  </TableCell>
                  <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                    {item.added || '-'}
                  </TableCell>
                  <TableCell className="w-12 px-0 py-0 text-right">
                    <div className="flex items-center justify-end gap-px pr-2 transition-opacity opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onEdit(item)}
                        className="w-5 h-5 text-muted-foreground/50 hover:text-foreground"
                      >
                        <Pencil className="size-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDelete(item.id)}
                        className="w-5 h-5 text-muted-foreground/50 hover:text-destructive"
                      >
                        <Trash2 className="size-2.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-xs text-center text-muted-foreground/55">
                    No customers found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
            {editingId ? 'Editing Customer' : 'New Customer'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <FloatingInput
            label="Last name"
            value={draft.lname}
            onChange={(e) => setDraft((s) => ({ ...s, lname: e.target.value }))}
          />
          <FloatingInput
            label="First name"
            value={draft.fname}
            onChange={(e) => setDraft((s) => ({ ...s, fname: e.target.value }))}
          />
          <FloatingInput
            label="Middle name"
            value={draft.mname}
            onChange={(e) => setDraft((s) => ({ ...s, mname: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <FloatingInput
              label="Barangay"
              value={draft.brgy}
              onChange={(e) => setDraft((s) => ({ ...s, brgy: e.target.value }))}
            />
            <FloatingInput
              label="City"
              value={draft.city}
              onChange={(e) => setDraft((s) => ({ ...s, city: e.target.value }))}
            />
          </div>
          <FloatingInput
            label="Contact #"
            value={draft.contact}
            onChange={(e) => setDraft((s) => ({ ...s, contact: e.target.value }))}
          />
          <FloatingInput
            label="Agent"
            value={draft.agent}
            onChange={(e) => setDraft((s) => ({ ...s, agent: e.target.value }))}
          />
          <FloatingInput
            label="Referred by"
            value={draft.ref}
            onChange={(e) => setDraft((s) => ({ ...s, ref: e.target.value }))}
          />

          <div className="pt-0.5 space-y-1.5">
            <div className="flex gap-1.5">
              <ActionTooltip label={editingId ? 'Update customer' : 'Save customer'} shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
                <Button type="button" onClick={onSave} className="flex-1 text-xs h-7">
                  {editingId ? 'Update' : 'Save Customer'}
                </Button>
              </ActionTooltip>
              <ActionTooltip label="Cancel" shortcut={kb.cancel()}>
                <Button type="button" variant="outline" onClick={reset} className="px-3 text-xs h-7">
                  Cancel
                </Button>
              </ActionTooltip>
            </div>

            {editingId && (
              <ActionTooltip label="Delete customer" shortcut={kb.deleteRow()}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onDelete(editingId)}
                  className="w-full text-xs transition-colors h-7 border-destructive/30 text-destructive/80 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="size-3 mr-1.5" />
                  Delete Customer
                </Button>
              </ActionTooltip>
            )}
          </div>
        </div>
      </section>
    </div>
  ) : (
    <section className="flex flex-col h-full overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/5">
        <div>
          <h2 className="text-sm font-semibold">Installment Overview</h2>
          <p className="text-[10px] text-muted-foreground">Manage accounts, loans, and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Add Loan
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Add Payment
          </Button>
          <ActionTooltip label="Start a new installment account" shortcut={kb.newField()}>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                reset()
                setShowForm(true)
              }}
            >
              <UserPlus className="size-3.5 mr-1.5" /> New Account
            </Button>
          </ActionTooltip>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-3">
          <Stat title="Due Today" value="5" sub="₱12,500.00 Expected" color="blue" />
          <Stat title="Past Due" value="12" sub="Requires follow-up" color="red" />
          <Stat title="Recently Paid" value="Juan Dela Cruz" sub="₱1,500.00" color="emerald" />
        </div>

        {/* Quick Search */}
        <div className="p-4 border rounded-lg bg-muted/10">
          <h3 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground">Quick Search</h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute -translate-y-1/2 left-3 top-1/2 size-4 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full h-10 pl-10 pr-4 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                onFocus={() => setShowForm(true)}
              />
            </div>
            <Button variant="secondary" onClick={() => setShowForm(true)}>
              Advanced Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ title, value, sub, color }: { title: string; value: string; sub: string; color: 'blue' | 'red' | 'emerald' }) {
  const colors = {
    blue: 'border-l-blue-500 bg-blue-500/5',
    red: 'border-l-red-500 bg-red-500/5',
    emerald: 'border-l-emerald-500 bg-emerald-500/5',
  }
  return (
    <div className={cn('p-4 border-l-4 rounded-r-lg shadow-sm bg-card border-y border-r', colors[color])}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{title}</p>
      <p className="mt-1 text-xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground font-medium">{sub}</p>
    </div>
  )
}






