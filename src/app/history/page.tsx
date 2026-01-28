'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { HistoryList } from '@/components/history/HistoryList'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { SourcesList } from '@/components/SourcesList'

interface Search {
  id: string
  query: string
  answer: string
  sources?: any
  createdAt: string
}

export default function HistoryPage() {
  const { data: session } = useSession()
  const [selectedSearch, setSelectedSearch] = useState<Search | null>(null)

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          <p>请先登录查看搜索历史</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">搜索历史</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 历史列表 */}
        <div className="lg:col-span-1">
          <HistoryList onSelectSearch={setSelectedSearch} />
        </div>

        {/* 详情视图 */}
        <div className="lg:col-span-2">
          {selectedSearch ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {selectedSearch.query}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedSearch.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <AnswerDisplay answer={selectedSearch.answer} />
              {selectedSearch.sources && (
                <SourcesList sources={selectedSearch.sources} />
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              选择一条搜索记录查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
