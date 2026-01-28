'use client'
import { useState, FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function SearchInput({ onSearch, isLoading = false, placeholder = '搜索任何内容...' }: SearchInputProps) {
  const [query, setQuery] = useState('')
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }
  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} disabled={isLoading} className="pl-10 pr-20 h-12 text-lg" />
        <Button type="submit" disabled={isLoading || !query.trim()} className="absolute right-2 top-1/2 h-8 -translate-y-1/2">
          {isLoading ? '搜索中...' : '搜索'}
        </Button>
      </div>
    </form>
  )
}
