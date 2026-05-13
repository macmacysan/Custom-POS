import * as React from 'react'
import { Pencil, Trash2, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'
import { usePosStore } from '@/state/pos-store'
import type { InstallmentEntry } from '@/types/pos'
import { kb } from '@/lib/keyboard-hints'

const defaultDraft: Omit<InstallmentEntry, 'id' | 'added'> = {
  branch: 'GOA', lname: '', fname: '', mname: '', suffix: 'NONE', street: '', brgy: '', city: 'GOA', prov: 'CAMARINES SUR', occ: '', contact: '', agent: '', ref: '',
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
      branch: item.branch, lname: item.lname, fname: item.fname, mname: item.mname, suffix: item.suffix,
      street: item.street, brgy: item.brgy, city: item.city, prov: item.prov, occ: item.occ,
      contact: item.contact, agent: item.agent, ref: item.ref,
    })
  }

  function onSave() {
    if (!draft.lname.trim() || !draft.fname.trim()) return
    const next: InstallmentEntry = {
      id: editingId ?? Date.now().toString(),
      ...draft,
      added: new Date().toISOString().slice(0, 10),
    }

    setInstallments((prev) => editingId ? prev.map((item) => (item.id === editingId ? next : item)) : [...prev, next])
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
    <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[1fr_320px]">
      <section className="rounded-none bg-card">
        <div className="flex flex-wrap gap-2 border-b p-3">
          <FloatingInput
            label="Search name/contact"
            className="max-w-60"
            id={showForm ? undefined : 'primary-input'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FloatingInput label="Filter agent" className="max-w-60" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} />
          <ActionTooltip label="Close form" shortcut={kb.cancel()}>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Back
            </Button>
          </ActionTooltip>
        </div>
        <div className="max-h-[62svh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead><TableHead>Last Name</TableHead><TableHead>First Name</TableHead><TableHead>Barangay</TableHead><TableHead>City</TableHead><TableHead>Contact</TableHead><TableHead>Agent</TableHead><TableHead>Added</TableHead><TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.branch}</TableCell>
                  <TableCell className="font-semibold text-primary">{item.lname}</TableCell>
                  <TableCell>{item.fname}</TableCell>
                  <TableCell>{item.brgy}</TableCell>
                  <TableCell>{item.city}</TableCell>
                  <TableCell>{item.contact}</TableCell>
                  <TableCell>{item.agent}</TableCell>
                  <TableCell>{item.added}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon-xs" onClick={() => onEdit(item)}><Pencil className="size-3" /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => onDelete(item.id)}><Trash2 className="size-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3 rounded-none border-l bg-muted/20 p-3">
        <h3 className="text-sm font-semibold">{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
        <FloatingInput
          id="primary-input"
          label="Last name"
          value={draft.lname}
          onChange={(e) => setDraft((s) => ({ ...s, lname: e.target.value }))}
        />
        <FloatingInput label="First name" value={draft.fname} onChange={(e) => setDraft((s) => ({ ...s, fname: e.target.value }))} />
        <FloatingInput label="Middle name" value={draft.mname} onChange={(e) => setDraft((s) => ({ ...s, mname: e.target.value }))} />
        <FloatingInput label="Barangay" value={draft.brgy} onChange={(e) => setDraft((s) => ({ ...s, brgy: e.target.value }))} />
        <FloatingInput label="City" value={draft.city} onChange={(e) => setDraft((s) => ({ ...s, city: e.target.value }))} />
        <FloatingInput label="Contact" value={draft.contact} onChange={(e) => setDraft((s) => ({ ...s, contact: e.target.value }))} />
        <FloatingInput label="Agent" value={draft.agent} onChange={(e) => setDraft((s) => ({ ...s, agent: e.target.value }))} />
        <FloatingInput label="Referred by" value={draft.ref} onChange={(e) => setDraft((s) => ({ ...s, ref: e.target.value }))} />
        <div className="grid grid-cols-3 gap-2">
          <ActionTooltip label={editingId ? 'Update customer' : 'Save customer'} shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
            <Button type="button" onClick={onSave}>{editingId ? 'Update' : 'Save'}</Button>
          </ActionTooltip>
          <ActionTooltip label="Clear form" shortcut={kb.cancel()}>
            <Button type="button" variant="outline" onClick={reset}>Cancel</Button>
          </ActionTooltip>
          <ActionTooltip label="Delete customer" shortcut={kb.deleteRow()}>
            <Button type="button" variant="destructive" disabled={!editingId} onClick={() => editingId && onDelete(editingId)}>
              Delete
            </Button>
          </ActionTooltip>
        </div>
      </section>
    </div>
  ) : (
    <section className="rounded-none border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <ActionTooltip label="Start a new installment account" shortcut={kb.newField()}>
          <Button
            id="primary-input"
            type="button"
            onClick={() => {
              reset()
              setShowForm(true)
            }}
          >
            <UserPlus className="size-4" /> New Account
          </Button>
        </ActionTooltip>
        <Button variant="outline">Add Loan</Button>
        <Button variant="outline">Add Payment</Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Stat title="Due Today" value="5" sub="?12,500.00 Expected" />
        <Stat title="Past Due" value="12" sub="Requires follow-up" />
        <Stat title="Last Account Paid" value="Juan Dela Cruz" sub="?1,500.00" />
      </div>
    </section>
  )
}

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-none border bg-muted/40 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

