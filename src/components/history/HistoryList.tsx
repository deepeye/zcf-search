'use client'

import useSWR from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Clock } from 'lucide-react'

interface Search {
  id: string
  query: string
  answer: string
  createdAt: string
}

interface HistoryListProps {
  onSelectSearch?: (search: Search) => void
}

export function HistoryList({ onSelectSearch }: HistoryListProps) {
  const { data, error, mutate } = useSWR('/api/history?limit=20')

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条搜索记录吗？')) return

    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (error) {
    return <div className="p-4 text-destructive">加载失败</div>
  }

  if (!data) {
    return <div className="p-4">加载中...</div>
  }

  const { searches } = data

  if (searches.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>还没有搜索历史</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {searches.map((search: Search) => (
        <Card
          key={search.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectSearch?.(search)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{search.query}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(search.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(search.id)
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
