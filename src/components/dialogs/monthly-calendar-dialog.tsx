import * as React from 'react'

import { CalendarIcon, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { FloatingInput } from '@/components/ui/floating-field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatNumber, valueOrDash } from '@/lib/money'

interface DailyData {
  day: number
  sales: number
  expenses: number
  variance: number
  remarks: string
}

function generateMonthlyData(year: number, month: number): DailyData[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const sales = Math.random() * 50000
    const expenses = Math.random() * 30000
    const variance = sales - expenses
    return {
      day,
      sales,
      expenses,
      variance,
      remarks: '',
    }
  })
}

export function MonthlyCalendarDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [data, setData] = React.useState<DailyData[]>(() =>
    generateMonthlyData(new Date().getFullYear(), new Date().getMonth()),
  )

  const grandTotalSales = data.reduce((sum, row) => sum + row.sales, 0)
  const grandTotalExpenses = data.reduce((sum, row) => sum + row.expenses, 0)
  const grandTotalVariance = grandTotalSales - grandTotalExpenses

  const handleRemarksChange = (day: number, value: string) => {
    setData((prev) => prev.map((row) => (row.day === day ? { ...row, remarks: value } : row)))
  }

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      setData(generateMonthlyData(nextDate.getFullYear(), nextDate.getMonth()))
      return nextDate
    })
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      setData(generateMonthlyData(nextDate.getFullYear(), nextDate.getMonth()))
      return nextDate
    })
  }

  const monthYearString = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <CalendarIcon className="mr-2 size-4" />
            Monthly Calendar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[66vw] w-full gap-0 p-0 sm:max-w-[66vw]">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div>
            <h2 className="text-sm font-semibold">Monthly Summary</h2>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePrevMonth}>
                <CaretLeft className="size-4" />
              </Button>
              <p className="text-xs font-medium w-24 text-center text-foreground">{monthYearString}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNextMonth}>
                <CaretRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[70vh] w-full">
          <table className="w-full caption-bottom text-xs">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm outline-1 outline-border">
              <TableRow className="h-8 hover:bg-transparent">
                <TableHead className="w-16 text-center h-8 py-1 px-2 font-semibold text-foreground">Day</TableHead>
                <TableHead className="text-right h-8 py-1 px-2 font-semibold text-foreground">Total Sales</TableHead>
                <TableHead className="text-right h-8 py-1 px-2 font-semibold text-foreground">Total Expenses</TableHead>
                <TableHead className="text-right h-8 py-1 px-2 font-semibold text-foreground">Variance</TableHead>
                <TableHead className="text-left h-8 py-1 px-2 w-1/3 font-semibold text-foreground">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={row.day} className={`h-8 ${index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'}`}>
                  <TableCell className="w-16 text-center font-medium py-1 px-2 text-foreground">{row.day}</TableCell>
                  <TableCell className="text-right py-1 px-2 text-foreground">{formatNumber(row.sales)}</TableCell>
                  <TableCell className="text-right py-1 px-2 text-muted-foreground">{formatNumber(row.expenses)}</TableCell>
                  <TableCell className={`text-right py-1 px-2 font-medium ${row.variance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    {valueOrDash(row.variance)}
                  </TableCell>
                  <TableCell className="p-0 px-1">
                    <FloatingInput
                      label="Remark"
                      containerClassName="w-full min-w-30"
                      className="h-7 border-none bg-transparent px-2 text-xs focus-visible:bg-muted/50"
                      value={row.remarks}
                      onChange={(e) => handleRemarksChange(row.day, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="sticky bottom-0 z-10 bg-muted/90 font-semibold shadow-sm outline-1 outline-border">
              <TableRow className="h-8 hover:bg-transparent">
                <TableCell className="text-center py-1 px-2 text-foreground">Grand Total</TableCell>
                <TableCell className="text-right py-1 px-2 text-foreground">{formatNumber(grandTotalSales)}</TableCell>
                <TableCell className="text-right py-1 px-2 text-muted-foreground">{formatNumber(grandTotalExpenses)}</TableCell>
                <TableCell className={`text-right py-1 px-2 font-bold ${grandTotalVariance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {valueOrDash(grandTotalVariance)}
                </TableCell>
                <TableCell className="text-left py-1 px-2 text-muted-foreground">-</TableCell>
              </TableRow>
            </TableFooter>
          </table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
