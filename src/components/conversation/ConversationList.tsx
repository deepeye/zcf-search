'use client'

import useSWR from 'swr'
import { Card } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  title: string
  updatedAt: string
  messages: Array<{ role: string; content: string }>
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void
  selectedId?: string
}

export function ConversationList({
  onSelectConversation,
  selectedId,
}: ConversationListProps) {
  const { data: conversations, error } = useSWR<Conversation[]>(
    '/api/conversations'
  )

  if (error) {
    return <div className="p-4 text-destructive">加载对话列表失败</div>
  }

  if (!conversations) {
    return <div className="p-4">加载中...</div>
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>还没有对话记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <Card
          key={conv.id}
          className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
            selectedId === conv.id ? 'bg-accent' : ''
          }`}
          onClick={() => onSelectConversation(conv.id)}
        >
          <h3 className="font-medium text-sm truncate">{conv.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(conv.updatedAt).toLocaleDateString('zh-CN')}
          </p>
        </Card>
      ))}
    </div>
  )
}
