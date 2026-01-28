'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { SourcesList } from '@/components/SourcesList'

interface SearchResult {
  answer: string
  sources: Array<{
    title: string
    url: string
    content: string
  }>
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '搜索失败')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">ZCF Search</h1>
          <p className="text-muted-foreground">AI 驱动的智能搜索引擎</p>
        </div>

        <div className="mb-8">
          <SearchInput onSearch={handleSearch} isLoading={isLoading} placeholder="搜索任何内容..." />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AnswerDisplay answer={result.answer} isLoading={isLoading} />
            </div>
            <div>
              <SourcesList sources={result.sources} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
