import * as React from 'react'
import { 
  Plus, 
  Search, 
  LayoutList,
} from 'lucide-react'
import { format, isSameDay, isAfter, isBefore, parseISO } from 'date-fns'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { usePosStore } from '@/state/pos-store'
import { CustomCalendar } from '@/components/ui/calendar-custom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { ScheduleTask } from '@/types/pos'
import { TaskCard } from './task-card'
import { TaskFormDialog } from './task-form-dialog'

export function SchedulePanel() {
  const { scheduleTasks, setScheduleTasks } = usePosStore()
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<ScheduleTask | null>(null)

  React.useEffect(() => {
    console.log('[SchedulePanel] Mounted in environment:', typeof window !== 'undefined' ? 'Browser' : 'Server')
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredTasks = React.useMemo(() => {
    return scheduleTasks.filter(task => {
      try {
        const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (task.details || '').toLowerCase().includes(searchQuery.toLowerCase())
        
        if (!selectedDate) return matchesSearch
        
        const sDate = parseISO(task.startDate)
        const eDate = parseISO(task.endDate)
        
        const matchesDate = (isSameDay(selectedDate, sDate) || isAfter(selectedDate, sDate)) &&
                            (isSameDay(selectedDate, eDate) || isBefore(selectedDate, eDate))
        
        return matchesSearch && matchesDate
      } catch (err) {
        console.error('[SchedulePanel] Filter error for task:', task.id, err)
        return false
      }
    })
  }, [scheduleTasks, selectedDate, searchQuery])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setScheduleTasks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSaveTask = (taskData: Partial<ScheduleTask>) => {
    if (taskData.id) {
      setScheduleTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } as ScheduleTask : t))
    } else {
      const fallbackDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      const newTask: ScheduleTask = {
        id: crypto.randomUUID(),
        title: taskData.title || 'Untitled Task',
        details: taskData.details || '',
        startDate: taskData.startDate || fallbackDateStr,
        endDate: taskData.endDate || taskData.startDate || fallbackDateStr,
        color: taskData.color || 'bg-blue-500',
      }
      setScheduleTasks(prev => [newTask, ...prev])
    }
    setEditingTask(null)
    setIsDialogOpen(false)
  }

  const handleDeleteTask = (id: string) => {
    setScheduleTasks(prev => prev.filter(t => t.id !== id))
  }

  const calendarTasks = scheduleTasks.map(task => ({
    id: task.id,
    startDate: task.startDate,
    endDate: task.endDate,
    title: task.title,
    color: task.color,
  }))

  return (
    <div className="flex w-full h-full overflow-hidden select-none bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">
        <ResizablePanel defaultSize={75} minSize={30}>
          <div className="flex flex-col h-full p-6 overflow-hidden bg-background">
            <div className="w-full h-full max-w-[1400px] mx-auto flex flex-col min-h-0">
              <CustomCalendar
                selected={selectedDate}
                onSelect={setSelectedDate}
                tasks={calendarTasks}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/60 hover:bg-primary/20 transition-colors" />

        <ResizablePanel defaultSize={25} minSize={20} className="bg-muted/10">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 z-10 p-6 space-y-5 border-b bg-background shadow-sm border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-lg font-black tracking-tighter text-foreground uppercase">
                    {selectedDate ? format(selectedDate, 'EEEE') : 'Select Date'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                      {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'No date'}
                    </p>
                    {selectedDate && filteredTasks.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 h-4 font-black bg-primary/10 text-primary border-none">
                        {filteredTasks.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingTask(null)
                    setIsDialogOpen(true)
                  }}
                  className="rounded-full h-9 px-3.5 gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                  <Plus className="size-3.5" />
                  <span>Task</span>
                </Button>
              </div>
              
              <div className="relative w-full group">
                <Search className="absolute -translate-y-1/2 left-3 top-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="SEARCH SCHEDULE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-[10px] font-bold tracking-wider rounded-xl h-10 border-border/40 bg-muted/20 focus:bg-background transition-all shadow-inner"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground/30">
                    <LayoutList className="mb-4 size-10 stroke-[1.5] opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select a date</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground/30 px-6">
                    <div className="relative mb-6">
                      <LayoutList className="size-12 stroke-[1] opacity-20" />
                      <div className="absolute top-0 right-0 size-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    </div>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em]">Nothing scheduled</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsDialogOpen(true)}
                      className="h-8 text-[9px] font-black uppercase tracking-[0.2em] rounded-full px-6 border-dashed hover:border-solid hover:bg-primary/5 transition-all"
                    >
                      New Task
                    </Button>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={filteredTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {filteredTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={(t) => {
                              setEditingTask(t)
                              setIsDialogOpen(true)
                            }}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <TaskFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  )
}