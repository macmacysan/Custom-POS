import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "yyyy/mm/dd",
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  
  const [month, setMonth] = React.useState<Date | undefined>(date)
  
  const [inputValue, setInputValue] = React.useState(
    date ? format(date, "yyyy/MM/dd") : ""
  )

  React.useEffect(() => {
    if (value) {
      const safeValue = value.replace(/-/g, '/')
      const parsedDate = new Date(safeValue)
      
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate)
        setInputValue(format(parsedDate, "yyyy/MM/dd"))
        setMonth(parsedDate)
      }
    } else {
      setDate(undefined)
      setInputValue("")
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setInputValue(format(selectedDate, "yyyy/MM/dd"))
      onChange?.(format(selectedDate, "yyyy/MM/dd"))
      setOpen(false)
    } else {
      setInputValue("")
      onChange?.("")
    }
  }

  // FIXED: The Input Mask logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value

    // 1. Strip out everything except numbers
    const digits = val.replace(/\D/g, '')
    let formatted = digits

    // 2. Automatically format as yyyy/mm/dd while typing
    if (digits.length > 4 && digits.length <= 6) {
      formatted = `${digits.slice(0, 4)}/${digits.slice(4)}`
    } else if (digits.length > 6) {
      // 3. Strictly cap the digits at 8 (using slice 6 to 8)
      formatted = `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6, 8)}`
    }

    setInputValue(formatted)

    // 4. Only attempt to save and update the calendar if the date is fully complete (10 chars)
    if (formatted.length === 10) {
      const parsedDate = new Date(formatted)
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate)
        setMonth(parsedDate)
        onChange?.(format(parsedDate, "yyyy/MM/dd"))
      }
    }
  }

  return (
    <InputGroup className="w-full">
      <InputGroupInput
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleInputChange}
        maxLength={10} // Ensures the browser physically prevents typing past 10 characters
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              aria-label="Select date"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={handleSelect}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}