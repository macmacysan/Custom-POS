import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit2, Trash2 } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ScheduleTask } from '@/types/pos'

interface TaskCardProps {
  task: ScheduleTask
  onEdit: (task: ScheduleTask) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Safe timezone parsing logic for multi-day windows
  const startDate = typeof task.startDate === 'string' ? parseISO(task.startDate) : new Date(task.startDate)
  const endDate = typeof task.endDate === 'string' ? parseISO(task.endDate) : new Date(task.endDate)
  const isMultiDay = !isSameDay(startDate, endDate)

  // Renders "MMM d" for single days, or "MMM d - MMM d" for extended durations
  const dateDisplayString = isMultiDay 
    ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
    : format(startDate, 'MMM d')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative w-full select-none",
        isDragging && "z-50 opacity-40 scale-[1.02]"
      )}
    >
      <Card className="p-3 transition-all duration-300 rounded-2xl shadow-sm bg-background border-border/40 hover:border-primary/30 hover:shadow-md hover:bg-muted/5 group-hover:-translate-y-0.5">
        <div className="flex items-center gap-3">
          
          {/* Draggable Anchor */}
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 transition-colors rounded-lg cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary hover:bg-primary/5 shrink-0"
          >
            <GripVertical className="size-4" />
          </div>
          
          {/* Main Context Panel */}
          <div className="flex items-center justify-between flex-1 min-w-0 gap-3">
            <div className="min-w-0 space-y-1 flex-1">
              
              {/* Title Header with category indicator */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("size-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.3)]", task.color)} />
                <h4 className="text-[13px] font-bold tracking-tight truncate text-foreground group-hover:text-primary transition-colors">{task.title}</h4>
              </div>
              
              {/* Context Details */}
              {task.details && (
                <p className="text-[11px] text-muted-foreground/70 line-clamp-1 leading-normal pl-4 font-medium">
                  {task.details}
                </p>
              )}
            </div>
            
            {/* Action Utilities Block */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task)
                }}
                className="size-7 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary shrink-0 transition-colors"
              >
                <Edit2 className="size-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.stopPropagation() 
                  onDelete(task.id)
                }}
                className="size-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 transition-colors"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>

            {/* Right Controls Layout Slot */}
            <div className="flex items-center gap-2 shrink-0 group-hover:hidden">
              <Badge 
                variant="outline" 
                className="text-[9px] h-5 px-2 font-black uppercase tracking-widest bg-muted/30 text-muted-foreground/60 border-none rounded-full"
              >
                {dateDisplayString}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}