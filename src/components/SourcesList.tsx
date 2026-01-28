'use client'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SourcesList({ sources }: { sources: Array<{ title: string; url: string; content: string }> }) {
  if (sources.length === 0) return null
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">来源 ({sources.length})</h3>
      {sources.map((source, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">{index + 1}</Badge>
              <div className="flex-1 min-w-0">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline flex items-center gap-1">
                  {source.title} <ExternalLink className="h-3 w-3" />
                </a>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{source.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
