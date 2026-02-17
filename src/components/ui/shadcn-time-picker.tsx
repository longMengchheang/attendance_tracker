"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// --- Scroll Column Component ---
interface ScrollPickerProps {
    items: string[]
    value: string
    onChange: (value: string) => void
    className?: string
}

function ScrollPicker({ items, value, onChange, className }: ScrollPickerProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const isScrolling = React.useRef(false)
    const itemHeight = 32 // h-8 = 32px

    // Scroll to initial value on open
    React.useEffect(() => {
        if (containerRef.current) {
            const index = items.indexOf(value)
            if (index !== -1) {
                containerRef.current.scrollTop = index * itemHeight
            }
        }
    }, [items, value])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isScrolling.current) return
        
        // Use a timeout to detect when scrolling ends (simple debounce)
        // For real-time updates we can calculate the index based on scrollTop
        const scrollTop = e.currentTarget.scrollTop
        const index = Math.round(scrollTop / itemHeight)
        const newItem = items[index]
        if (newItem && newItem !== value) {
             // We can update immediately or wait for snap. 
             // Updating immediately gives snappy feedback but might trigger too many renders.
             // Given it's a small list, immediate is fine.
             onChange(newItem)
        }
    }

    return (
        <div 
            ref={containerRef}
            className={cn(
                "h-[160px] w-14 overflow-y-auto scroll-snap-y scroll-snap-mandatory scrollbar-hide relative overscroll-contain", 
                className
            )}
            style={{ 
                scrollSnapType: 'y mandatory',
                // Hide scrollbar for standard browsers
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none'
            }}
            onScroll={handleScroll}
        >
             {/* Padding to allow the first and last items to be centered */}
             {/* h-160px = 5 items visible. Center is item 3. 
                 Top padding needed = 2 items * 32px = 64px. 
             */}
            <div className="h-[64px]" /> 
            
            {items.map((item) => (
                <div 
                    key={item} 
                    className={cn(
                        "h-8 flex items-center justify-center text-sm transition-all duration-200 cursor-pointer scroll-snap-align-center hover:bg-gray-50",
                        item === value 
                            ? "font-bold text-[#F43F5E] scale-110" 
                            : "text-gray-400 font-medium scale-90 opacity-60"
                    )}
                    onClick={(e) => {
                        // Smooth scroll to this item on click
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    style={{ scrollSnapAlign: 'center' }}
                >
                    {item}
                </div>
            ))}
            
            <div className="h-[64px]" />
        </div>
    )
}


interface TimePickerProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false) // Controlled internally for now, but triggered by popover
  
  // Data ranges
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  // Shift 12 to 0 index if we want 01-12 order? standard is 12, 01, 02... or 01..12
  // Let's do 01, 02, ... 12.
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  const periods = ['AM', 'PM']

  // State
  const [hour, setHour] = React.useState("09")
  const [minute, setMinute] = React.useState("00")
  const [period, setPeriod] = React.useState("AM")

  // Sync state with value prop
  React.useEffect(() => {
    if (value) {
      // Try parsing as 12h format first
      const match12 = value.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i)
      if (match12) {
        let h = match12[1].padStart(2, '0')
        const m = match12[2]
        const p = match12[3]?.toUpperCase()
        if (h === '00') h = '12'
        setHour(h)
        setMinute(m)
        if (p) setPeriod(p)
        return
      }

      // Fallback to 24h parsing
      const match24 = value.match(/(\d{1,2}):(\d{2})/)
      if (match24) {
        let h = parseInt(match24[1], 10)
        const m = match24[2]
        const p = h >= 12 ? 'PM' : 'AM'
        
        if (h > 12) h -= 12
        if (h === 0) h = 12
        
        setHour(h.toString().padStart(2, '0'))
        setMinute(m)
        setPeriod(p)
      }
    }
  }, [value])

  const notifyChange = (h: string, m: string, p: string) => {
      onChange(`${h}:${m} ${p}`)
  }

  // Hide scrollbars via css class injection or inline style above
  
  return (
    <div className={cn("grid gap-2", className)}>
      {label && <Label className="text-sm font-semibold text-gray-700">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-medium bg-gray-50 border-gray-200 hover:bg-white hover:border-[#F43F5E] hover:text-[#F43F5E] focus:ring-2 focus:ring-[#F43F5E]/20 transition-all h-[46px] rounded-xl px-4",
              !value ? "text-gray-500 font-normal" : "text-gray-900"
            )}
          >
            <Clock className="mr-3 h-4 w-4 text-gray-400 group-hover:text-[#F43F5E]" />
            <span className="text-base tracking-wide">{value || "Pick a time"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 rounded-2xl shadow-2xl overflow-hidden bg-white" align="start">
          <div className="p-4 bg-white relative">
            
            {/* Header */}
            <div className="text-center mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Time</p>
            </div>

            {/* Spinner Container */}
            <div className="flex items-center justify-center gap-2 relative h-[160px] w-[220px]">
                
                {/* Selection Highlight Bar (Glass) */}
                <div className="absolute top-[64px] left-0 right-0 h-8 bg-gray-100/50 rounded-lg border-y border-gray-200/50 pointer-events-none z-0" />
                
                {/* Gradients */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

                {/* Columns */}
                <div className="flex gap-1 relative z-20">
                    <ScrollPicker 
                        items={hours} 
                        value={hour} 
                        onChange={(val) => {
                            setHour(val)
                            notifyChange(val, minute, period)
                        }} 
                    />
                    <div className="h-[160px] flex items-center justify-center pb-1">
                        <span className="text-gray-300 font-bold">:</span>
                    </div>
                    <ScrollPicker 
                        items={minutes} 
                        value={minute} 
                        onChange={(val) => {
                            setMinute(val)
                            notifyChange(hour, val, period)
                        }} 
                    />
                    <div className="w-2" /> 
                    <ScrollPicker 
                        items={periods} 
                        value={period} 
                        onChange={(val) => {
                            setPeriod(val)
                            notifyChange(hour, minute, val)
                        }} 
                    />
                </div>
            </div>

            {/* Accept Button (Optional, since we auto-save, but nice for UX) */}
             <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-center text-[#F43F5E] text-sm font-bold">
                    {hour}:{minute} {period}
                </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
