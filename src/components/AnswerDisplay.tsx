'use client'
import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/card'

export function AnswerDisplay({ answer, isLoading }: { answer: string; isLoading?: boolean }) {
  if (isLoading) {
    return <Card className="p-6"><div className="space-y-3"><div className="h-4 bg-muted animate-pulse rounded" /><div className="h-4 bg-muted animate-pulse rounded w-3/4" /></div></Card>
  }
  if (!answer) return null
  return <Card className="p-6"><div className="prose prose-slate max-w-none"><ReactMarkdown>{answer}</ReactMarkdown></div></Card>
}
