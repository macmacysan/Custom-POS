import * as React from 'react'
import { Plus, Save, Calendar as CalendarIcon } from 'lucide-react'
import { format, parseISO, isBefore, isSameDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ScheduleTask } from '@/types/pos'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Partial<ScheduleTask>) => void
  task?: ScheduleTask | null
}

const COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Emerald', value: 'bg-emerald-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Rose', value: 'bg-rose-500' },
  { name: 'Violet', value: 'bg-violet-500' },
  { name: 'Slate', value: 'bg-slate-500' },
]

export function TaskFormDialog({ open, onOpenChange, onSave, task }: TaskFormDialogProps) {
  const [title, setTitle] = React.useState('')
  const [details, setDetails] = React.useState('')
  const [color, setColor] = React.useState(COLORS[0].value)
  
  // Track continuous timeline selection states via react-day-picker DateRange
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  })

  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDetails(task.details)
      setColor(task.color)
      
      const parsedStart = typeof task.startDate === 'string' ? parseISO(task.startDate) : new Date(task.startDate)
      const parsedEnd = typeof task.endDate === 'string' ? parseISO(task.endDate) : new Date(task.endDate)
      
      setDateRange({
        from: parsedStart,
        to: parsedEnd
      })
    } else {
      setTitle('')
      setDetails('')
      setColor(COLORS[0].value)
      setDateRange({
        from: new Date(),
        to: new Date()
      })
    }
  }, [task, open])

  const handleSave = () => {
    if (!title.trim() || !dateRange?.from) return

    // Fallback assignment rules: if a user clicks a single date and closes, treat it as a 1-day duration task
    const startDateNormalized = dateRange.from
    let endDateNormalized = dateRange.to || dateRange.from

    // Safety layer: guarantee dates didn't accidentally get structurally reversed in state mutations
    if (isBefore(endDateNormalized, startDateNormalized)) {
      endDateNormalized = startDateNormalized
    }

    onSave({
      id: task?.id,
      title,
      details,
      startDate: format(startDateNormalized, 'yyyy-MM-dd'),
      endDate: format(endDateNormalized, 'yyyy-MM-dd'),
      color,
    })
    onOpenChange(false)
  }

  // Formatting strings for the range trigger button label
  const getDateLabel = () => {
    if (!dateRange?.from) return <span>Pick a task duration</span>
    if (!dateRange.to || isSameDay(dateRange.from, dateRange.to)) {
      return format(dateRange.from, "LLL dd, yyyy")
    }
    return `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, yyyy")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-4 gap-4">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="text-base">{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription className="text-xs">
            Enter the details and duration boundaries of your schedule task.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-1 space-y-3">
          {/* Title Field Input */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-semibold">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Inventory Audit, Delivery Window..."
              className="h-8 text-xs px-2.5 rounded-md border-border/60 bg-background"
            />
          </div>

          {/* Date Duration Range Picker Input */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Task Duration</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full h-8 justify-start text-left text-xs font-normal px-2.5 rounded-md border-border/60 bg-background",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{getDateLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Details / Description Field Area */}
          <div className="space-y-1">
            <Label htmlFor="details" className="text-xs font-semibold">Details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add auxiliary assignment criteria, tags, notes..."
              className="text-xs px-2.5 py-2 rounded-md border-border/60 min-h-[70px] bg-background resize-none leading-normal"
            />
          </div>

          {/* Task Timeline Category Selector Grid */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Task Category Color</Label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "size-6 rounded-full border-2 transition-all shrink-0 relative",
                    c.value,
                    color === c.value 
                      ? "border-foreground scale-105 shadow-sm ring-2 ring-background ring-offset-0" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 pt-2 border-t sm:gap-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            className="gap-1.5 text-xs h-8 px-3.5"
          >
            {task ? <Save className="size-3.5" /> : <Plus className="size-3.5" />}
            <span>{task ? 'Update Task' : 'Create Task'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}