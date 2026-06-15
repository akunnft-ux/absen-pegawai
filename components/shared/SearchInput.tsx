"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchInputProps {
  value: string
  onChange: (query: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setLocalValue(newValue)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        onChange(newValue)
      }, debounceMs)
    },
    [onChange, debounceMs]
  )

  const handleClear = useCallback(() => {
    setLocalValue("")
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onChange("")
  }, [onChange])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
          onClick={handleClear}
          type="button"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
