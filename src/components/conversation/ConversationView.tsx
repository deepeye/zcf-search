'use client'

import { useEffect, useState } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { MessageList } from '@/components/conversation/MessageList'
import { SourcesList } from '@/components/SourcesList'
import { searchWeb } from '@/lib/search'
import { generateAnswer } from '@/lib/ai'

interface Message {
  id: string
  role: string
  content: string
  sources?: any
}

interface ConversationViewProps {
  conversationId: string
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 加载对话消息
    fetch(`/api/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || [])
      })
      .catch((error) => {
        console.error('Load conversation error:', error)
      })
  }, [conversationId])

  const handleSearch = async (query: string) => {
    setIsLoading(true)

    try {
      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: query
      }
      setMessages((prev) => [...prev, userMessage])

      // 执行搜索
      const searchResults = await searchWeb(query)
      setSources(searchResults)

      // 生成答案
      const answer = await generateAnswer(query, searchResults)

      // 添加助手消息
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        sources: searchResults,
      }
      setMessages((prev) => [...prev, assistantMessage])

      // 保存到后端
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: query,
        }),
      })

      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: answer,
          sources: searchResults,
        }),
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MessageList messages={messages} />
        </div>
        <div>
          {sources.length > 0 && <SourcesList sources={sources} />}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
        <SearchInput onSearch={handleSearch} isLoading={isLoading} />
      </div>
    </div>
  )
}
