'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ConversationList } from '@/components/conversation/ConversationList'
import { ConversationView } from '@/components/conversation/ConversationView'

export default function ConversationsPage() {
  const { data: session } = useSession()
  const [selectedConversation, setSelectedConversation] = useState<string>()

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          <p>请先登录查看对话历史</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">对话历史</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 侧边栏 - 对话列表 */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">对话列表</h2>
          <ConversationList
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation}
          />
        </div>

        {/* 主内容 - 对话视图 */}
        <div className="lg:col-span-3">
          {selectedConversation ? (
            <ConversationView conversationId={selectedConversation} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              请选择一个对话开始
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
