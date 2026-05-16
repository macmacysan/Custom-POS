import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isAfter, isBefore } from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface CustomCalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  tasks?: Array<{ id: string; startDate: string; endDate: string; title: string; color: string }>
}

export function CustomCalendar({ selected, onSelect, tasks = [] }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const firstDay = monthStart.getDay()
  const prevMonthDays = Array.from({ length: firstDay }, (_, i) => {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - (firstDay - i))
    return date
  })
  
  const totalCells = 42
  const nextMonthDays = Array.from({ length: totalCells - (prevMonthDays.length + daysInMonth.length) }, (_, i) => {
    const date = new Date(monthEnd)
    date.setDate(date.getDate() + i + 1)
    return date
  })
  
  const allDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays]

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth(next => addMonths(next, 1))
  const handleGoToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onSelect?.(today)
  }

  // Calculate grid tracking map to find which row level a timeline ribbon belongs to
  const computedTaskRows = React.useMemo(() => {
    const rows: Array<{ task: any; startIndex: number; endIndex: number; rowLevel: number }> = []
    
    // Sort tasks by duration length first so longer spans take top rows natively
    const sortedTasks = [...tasks].sort((a, b) => {
      const lenA = parseISO(a.endDate).getTime() - parseISO(a.startDate).getTime()
      const lenB = parseISO(b.endDate).getTime() - parseISO(b.startDate).getTime()
      return lenB - lenA
    })

    sortedTasks.forEach(task => {
      const sDate = parseISO(task.startDate)
      const eDate = parseISO(task.endDate)
      
      let startIndex = allDays.findIndex(d => isSameDay(d, sDate))
      let endIndex = allDays.findIndex(d => isSameDay(d, eDate))
      
      if (startIndex === -1 && isAfter(sDate, allDays[allDays.length - 1])) return
      if (endIndex === -1 && isBefore(eDate, allDays[0])) return
      
      if (startIndex === -1) startIndex = 0
      if (endIndex === -1) endIndex = allDays.length - 1

      let rowLevel = 0
      while (rows.some(r => r.rowLevel === rowLevel && !(startIndex > r.endIndex || endIndex < r.startIndex))) {
        rowLevel++
      }

      rows.push({ task, startIndex, endIndex, rowLevel })
    })

    return rows
  }, [tasks, allDays])

  return (
    <Card className="flex flex-col w-full h-full min-h-0 p-6 overflow-hidden border shadow-xl bg-background rounded-3xl border-border/50">
      {/* Header Month Nav */}
      <div className="flex items-center justify-between pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoToToday}
            className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-full border-2 border-primary/20 hover:border-primary transition-all"
          >
            TODAY
          </Button>
        </div>
        <div className="flex gap-2 p-1.5 rounded-2xl bg-muted/30 border border-border/40">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="p-0 transition-all rounded-xl size-9 hover:bg-background hover:shadow-sm"><ChevronLeft className="size-5" /></Button>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="p-0 transition-all rounded-xl size-9 hover:bg-background hover:shadow-sm"><ChevronRight className="size-5" /></Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-[1px] pb-3 text-center border-b border-border/40 shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] h-6 flex items-center justify-center">{day}</div>
        ))}
      </div>

      {/* Main Container Wrapper */}
      <div className="relative flex-1 w-full min-h-0 mt-4 overflow-hidden border shadow-inner rounded-2xl bg-muted/20 border-border/40">
        
        {/* Background Grid Layer */}
        <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-[1px] bg-border/30">
          {allDays.map((date, idx) => {
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isSelected = selected && isSameDay(date, selected)
            const isToday = isSameDay(date, new Date())

            return (
              <button
                key={idx}
                onClick={() => onSelect?.(date)}
                className={cn(
                  "h-full w-full p-3.5 flex flex-col justify-start items-start text-left transition-all duration-300 relative group",
                  isCurrentMonth ? "bg-background" : "bg-muted/5 text-muted-foreground/15",
                  isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/30",
                  isToday && "after:absolute after:top-4 after:right-4 after:size-2 after:bg-primary after:rounded-full after:shadow-[0_0_12px_rgba(var(--primary),0.6)]"
                )}
              >
                <span className={cn(
                  "text-[13px] font-black tabular-nums transition-all",
                  isToday ? "text-primary scale-110" : "text-foreground/40",
                  !isCurrentMonth && "opacity-20",
                  isSelected && "text-primary opacity-100"
                )}>
                  {format(date, 'd')}
                </span>
                {isSelected && (
                  <div className="absolute inset-0 border-[3px] border-primary/20 pointer-events-none rounded-[inherit]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Foreground Layer: Continuous Multi-Day Ribbon Spans */}
        <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-[1px] pointer-events-none">
          {computedTaskRows.map(({ task, startIndex, endIndex, rowLevel }) => {
            const startRow = Math.floor(startIndex / 7)
            const endRow = Math.floor(endIndex / 7)

            return Array.from({ length: endRow - startRow + 1 }, (_, i) => {
              const currentRow = startRow + i
              const currentStart = currentRow === startRow ? (startIndex % 7) : 0
              const currentEnd = currentRow === endRow ? (endIndex % 7) : 6

              // Offset from top of row to clear the day number (approx 34px)
              const topOffset = 38 + rowLevel * 22 

              return (
                <div
                  key={`${task.id}-${currentRow}`}
                  style={{ 
                    gridRowStart: currentRow + 1, 
                    gridColumnStart: currentStart + 1, 
                    gridColumnEnd: currentEnd + 2,
                    top: `${topOffset}px`
                  }}
                  className={cn(
                    "absolute h-[19px] left-1.5 right-1.5 text-[10px] text-white px-2.5 font-black uppercase tracking-wider flex items-center pointer-events-auto shadow-lg transition-all hover:scale-[1.03] hover:z-20 active:scale-95",
                    task.color,
                    currentRow === startRow ? "rounded-l-xl" : "border-l-0 rounded-l-none",
                    currentRow === endRow ? "rounded-r-xl" : "border-r-0 rounded-r-none",
                    "border-y border-white/15"
                  )}
                  title={task.title}
                >
                  {currentRow === startRow && <span className="truncate drop-shadow-md">{task.title}</span>}
                </div>
              )
            })
          })}
        </div>
      </div>
    </Card>
  )
}
