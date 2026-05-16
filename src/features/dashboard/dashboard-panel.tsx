import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  ShoppingCart,
  Activity,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { usePosStore } from "@/state/pos-store"
import { formatCurrency } from "@/lib/money"
import { calculateMasterTotals } from "@/features/sidebar/calculations"
import { cn } from "@/lib/utils"

/* ─── Sparkline-style mini chart data (sample, replace with real store data) ─ */
const salesTrend = [
  { day: "Mon", sales: 12400, expenses: 8200 },
  { day: "Tue", sales: 18900, expenses: 11300 },
  { day: "Wed", sales: 9200,  expenses: 7100 },
  { day: "Thu", sales: 24300, expenses: 14200 },
  { day: "Fri", sales: 31000, expenses: 18900 },
  { day: "Sat", sales: 28700, expenses: 15400 },
  { day: "Sun", sales: 19500, expenses: 12100 },
]

const paymentBreakdown = [
  { name: "Cash",     value: 42, color: "#3b82f6" },
  { name: "Check",    value: 28, color: "#8b5cf6" },
  { name: "Transfer", value: 18, color: "#10b981" },
  { name: "GCash",    value: 8,  color: "#f59e0b" },
  { name: "eWallet",  value: 4,  color: "#ef4444" },
]

const recentActivity = [
  { type: "Sales Invoice",    ref: "SI-2041", amount: 4500,   time: "09:12 AM", dir: "in"  },
  { type: "Cash Expense",     ref: "REC-202", amount: 890,    time: "09:45 AM", dir: "out" },
  { type: "Bank Check",       ref: "CHK-100", amount: 15000,  time: "10:03 AM", dir: "in"  },
  { type: "Drawing",          ref: "DW-09",   amount: 300,    time: "10:28 AM", dir: "out" },
  { type: "SI - Trading",     ref: "SI-2042", amount: 2800,   time: "11:15 AM", dir: "in"  },
  { type: "Cash Purchase",    ref: "PO-1001", amount: 1250,   time: "11:40 AM", dir: "out" },
  { type: "GCash",            ref: "GC-0092", amount: 750,    time: "12:05 PM", dir: "in"  },
  { type: "Delivery Receipt", ref: "DR-0331", amount: 3200,   time: "01:20 PM", dir: "in"  },
]

/* ─── Tooltip customisation ──────────────────────────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; color: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-mono font-medium text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  accent,
  negative,
}: {
  title: string
  value: string
  delta?: string
  deltaLabel?: string
  icon: React.ElementType
  accent?: string
  negative?: boolean
}) {
  return (
    <Card className="relative overflow-hidden">
      {/* subtle accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-0.75", accent ?? "bg-primary/40")} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className={cn("text-2xl font-bold tabular-nums tracking-tight", negative && "text-red-500 dark:text-red-400")}>
              {value}
            </p>
          </div>
          <div className={cn("rounded-md p-2 text-primary", accent ? "" : "bg-primary/10")}>
            <Icon className="size-4" />
          </div>
        </div>
        {delta && (
          <div className="mt-3 flex items-center gap-1">
            {negative
              ? <ArrowDownRight className="size-3.5 text-red-500" />
              : <ArrowUpRight className="size-3.5 text-emerald-500" />}
            <span className={cn("text-xs font-medium", negative ? "text-red-500" : "text-emerald-500")}>
              {delta}
            </span>
            {deltaLabel && (
              <span className="text-xs text-muted-foreground">{deltaLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export function DashboardPanel() {
  const { sidebar, expenses, checks, income, payments } = usePosStore()
  const totals = calculateMasterTotals(sidebar, expenses, checks, income, payments)

  const variance      = totals.cashVariance
  const isBalanced    = variance === 0
  const isShort       = variance < 0

  return (
    <ScrollArea className="h-[calc(100vh-3.5rem)]">
      <div className="p-4 md:p-5 space-y-4 md:space-y-5 max-w-350 mx-auto pb-10">
        <div id="primary-input" tabIndex={-1} className="sr-only" aria-hidden />

        {/* ── Cash Variance Banner ─────────────────────────────────── */}
        {!isBalanced && (
          <div className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
            isShort
              ? "border-red-500/30 bg-red-500/8 text-red-600 dark:text-red-400"
              : "border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400"
          )}>
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Cash is <strong>{isShort ? "SHORT" : "OVER"}</strong> by{" "}
              <strong className="font-mono">{formatCurrency(Math.abs(variance))}</strong>
              {isShort ? " — investigate missing cash before closing." : " — verify overage source."}
            </span>
          </div>
        )}

        {/* ── KPI Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            title="Total Cash Receipts"
            value={formatCurrency(totals.totalPaidCash)}
            icon={TrendingUp}
            accent="bg-emerald-500/50"
            delta="+12.4%"
            deltaLabel="vs yesterday"
          />
          <KpiCard
            title="Total Paid Out"
            value={formatCurrency(totals.totalPaidOut)}
            icon={TrendingDown}
            accent="bg-red-500/50"
            delta="8.1%"
            deltaLabel="vs yesterday"
            negative
          />
          <KpiCard
            title="Expected Cash"
            value={formatCurrency(totals.expectedCash)}
            icon={Wallet}
            accent="bg-blue-500/50"
          />
          <KpiCard
            title="Cash Variance"
            value={isBalanced ? "Balanced" : formatCurrency(variance)}
            icon={Activity}
            accent={isBalanced ? "bg-emerald-500/50" : isShort ? "bg-red-500/50" : "bg-amber-500/50"}
            negative={isShort}
          />
        </div>

        {/* ── Charts Row ───────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Area chart — Sales vs Expenses trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Weekly Cash Flow</CardTitle>
              <CardDescription className="text-xs">Sales receipts vs outflows this week</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salesTrend} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sales"    name="Sales"    stroke="#3b82f6" fill="url(#gSales)"    strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#gExpenses)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment breakdown bar */}
          <Card>
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Payment Mix</CardTitle>
              <CardDescription className="text-xs">How customers are paying today</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-2.5 mt-1">
                {paymentBreakdown.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{p.name}</span>
                      <span className="font-mono font-semibold tabular-nums">{p.value}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${p.value}%`, background: p.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Quick denomination totals from store */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Banknote className="size-3" />Cash</span>
                  <span className="font-mono tabular-nums text-foreground font-medium">{formatCurrency(totals.cashAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CreditCard className="size-3" />Bank Check</span>
                  <span className="font-mono tabular-nums text-foreground font-medium">{formatCurrency(totals.checkTotals.check)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CreditCard className="size-3" />Transfer</span>
                  <span className="font-mono tabular-nums text-foreground font-medium">{formatCurrency(totals.checkTotals.transfer)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Receipt className="size-3" />GCash</span>
                  <span className="font-mono tabular-nums text-foreground font-medium">{formatCurrency(totals.checkTotals.gcash)}</span>
                </div>
                <Separator className="my-1.5" />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total Payments</span>
                  <span className="font-mono tabular-nums">{formatCurrency(totals.totalPayments)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Transaction Ledger ────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 px-5 pt-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Transaction Ledger</CardTitle>
              <CardDescription className="text-xs">A quick view of the latest POS payments and receipts.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">New Sale</Button>
              <Button variant="outline" size="sm">Export</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((item) => (
                  <TableRow key={item.ref}>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.ref}</TableCell>
                    <TableCell className="font-mono text-foreground">{formatCurrency(item.amount)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold",
                        item.dir === "in"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      )}>
                        {item.dir === "in" ? "Paid" : "Refund"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{item.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="px-5 pb-4 pt-3">
            <span className="text-xs text-muted-foreground">Showing {recentActivity.length} recent transactions.</span>
          </CardFooter>
        </Card>

        {/* ── Bottom Row ───────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 px-5 pt-4">
              <CardTitle className="text-sm font-semibold">Today's Activity</CardTitle>
              <CardDescription className="text-xs">All cash movements logged today</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-1">
              <div className="divide-y divide-border">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        item.dir === "in"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}>
                        {item.dir === "in"
                          ? <ArrowUpRight className="size-3.5" />
                          : <ArrowDownRight className="size-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground leading-tight">{item.type}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.ref}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xs font-semibold font-mono tabular-nums",
                        item.dir === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                      )}>
                        {item.dir === "in" ? "+" : "−"}{formatCurrency(item.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right panel — Receipts + Outflows summary */}
          <div className="flex flex-col gap-4">

            {/* Receipts summary */}
            <Card>
              <CardHeader className="pb-2 px-5 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="size-3.5 text-blue-500" />
                  Receipt Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-1.5 text-xs">
                {[
                  { label: "Sales Invoice",    value: sidebar.salesInvoice,    qty: sidebar.salesInvoiceQty },
                  { label: "SI - Trading",     value: sidebar.siTrading,       qty: sidebar.siTradingQty },
                  { label: "Delivery Receipt", value: sidebar.deliveryReceipt, qty: sidebar.deliveryReceiptQty },
                  { label: "Bobs Pawnshop",    value: sidebar.bobsPawnshop,    qty: sidebar.bobsPawnshopQty },
                ].map(({ label, value, qty }) => (
                  <div key={label} className="flex items-center justify-between text-muted-foreground">
                    <span className="truncate">{label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {qty > 0 && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-sm">
                          ×{qty}
                        </Badge>
                      )}
                      <span className="font-mono tabular-nums text-foreground w-20 text-right">{formatCurrency(value)}</span>
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">{formatCurrency(totals.subtotalReceipts)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Outflows summary */}
            <Card>
              <CardHeader className="pb-2 px-5 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingCart className="size-3.5 text-red-500" />
                  Outflow Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-1.5 text-xs">
                {[
                  { label: "Cash Expenses",  value: totals.expenseTotals.company   },
                  { label: "Drawings",        value: totals.expenseTotals.drawings  },
                  { label: "Cash Purchases",  value: totals.expenseTotals.purchases },
                  { label: "Deductions",      value: totals.deductionsTotal         },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-muted-foreground">
                    <span>{label}</span>
                    <span className="font-mono tabular-nums text-foreground">{formatCurrency(value)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total Paid Out</span>
                  <span className="font-mono tabular-nums text-red-500 dark:text-red-400">{formatCurrency(totals.totalPaidOut)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </ScrollArea>
  )
}