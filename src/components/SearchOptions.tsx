'use client'

import { Button } from '@/components/ui/button'
import { Search, Image, Video } from 'lucide-react'

type SearchType = 'all' | 'images' | 'videos'

interface SearchOptionsProps {
  selected: SearchType
  onChange: (type: SearchType) => void
}

export function SearchOptions({
  selected,
  onChange,
}: SearchOptionsProps) {
  const options = [
    { value: 'all' as const, label: '全部', icon: Search },
    { value: 'images' as const, label: '图片', icon: Image },
    { value: 'videos' as const, label: '视频', icon: Video },
  ]

  return (
    <div className="flex gap-2 mb-4">
      {options.map((option) => {
        const Icon = option.icon
        return (
          <Button
            key={option.value}
            variant={selected === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(option.value)}
          >
            <Icon className="h-4 w-4 mr-1" />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
