import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const rows = [
  { id: 'TX-1042', time: '10:12', item: 'Espresso Ã—2', tender: 'Card', total: '$8.50' },
  { id: 'TX-1043', time: '10:18', item: 'Pastry bundle', tender: 'Cash', total: '$14.25' },
  { id: 'TX-1044', time: '10:24', item: 'Retail â€” Mug', tender: 'Card', total: '$22.00' },
  { id: 'TX-1045', time: '10:31', item: 'Latte + add-on', tender: 'Card', total: '$11.75' },
  { id: 'TX-1046', time: '10:36', item: 'Gift card load', tender: 'Card', total: '$50.00' },
]

export function SampleTransactionsTable() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Workspace</h2>
        <p className="text-xs text-muted-foreground">
          Drop in your POS line items, tickets, or ledger â€” this table is placeholder data.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[7rem]">Ticket</TableHead>
            <TableHead className="w-[5rem]">Time</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[6rem]">Tender</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{r.time}</TableCell>
              <TableCell className="font-medium">{r.item}</TableCell>
              <TableCell>{r.tender}</TableCell>
              <TableCell className="text-right tabular-nums">{r.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

