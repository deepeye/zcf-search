'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { SourcesList } from '@/components/SourcesList'
import { MediaGallery } from '@/components/media/MediaGallery'
import { SearchOptions } from '@/components/SearchOptions'
import { searchWeb, searchImages, searchVideos } from '@/lib/search'
import { generateAnswer } from '@/lib/ai'

type SearchType = 'all' | 'images' | 'videos'

interface SearchResult {
  answer?: string
  sources?: Array<{
    title: string
    url: string
    content: string
  }>
  images?: Array<{
    url: string
    title: string
    source: string
  }>
  videos?: Array<{
    url: string
    title: string
    description: string
    thumbnail: string
    source: string
  }>
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState<SearchType>('all')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [streamingAnswer, setStreamingAnswer] = useState('')

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setStreamingAnswer('')

    try {
      if (searchType === 'images') {
        const images = await searchImages(query)
        setResult({ images })
      } else if (searchType === 'videos') {
        const videos = await searchVideos(query)
        setResult({ videos })
      } else {
        // 对于文本搜索
        const sources = await searchWeb(query)
        setResult({ sources })

        // 获取流式响应
        const response = await fetch('/api/search/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })

        if (!response.ok) {
          throw new Error('搜索失败')
        }

        // 读取流式响应
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            setStreamingAnswer((prev) => prev + chunk)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setIsLoading(false)
    }
  }

  const displayAnswer = streamingAnswer || result?.answer

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">ZCF Search</h1>
          <p className="text-muted-foreground">AI 驱动的智能搜索引擎</p>
        </div>

        <div className="mb-8">
          <SearchOptions selected={searchType} onChange={setSearchType} />
          <SearchInput
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="搜索任何内容..."
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {displayAnswer && <AnswerDisplay answer={displayAnswer} isLoading={isLoading} />}
              {(result.images || result.videos) && (
                <MediaGallery images={result.images} videos={result.videos} />
              )}
            </div>
            {result.sources && (
              <div>
                <SourcesList sources={result.sources} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
