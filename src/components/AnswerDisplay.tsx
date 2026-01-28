'use client'

import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/card'

interface AnswerDisplayProps {
  answer?: string
  isLoading?: boolean
}

export function AnswerDisplay({ answer, isLoading }: AnswerDisplayProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </Card>
    )
  }

  if (!answer) return null

  return (
    <Card className="p-6">
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
    </Card>
  )
}
