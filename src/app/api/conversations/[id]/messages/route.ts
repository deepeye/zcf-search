import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/conversations/[id]/messages - 添加消息到对话
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { role, content, sources } = await request.json()

    // 验证对话所有权
    const conversation = await db.conversation.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 })
    }

    // 添加消息
    const message = await db.message.create({
      data: {
        conversationId: id,
        role,
        content,
        sources: sources || [],
      },
    })

    // 更新对话时间
    await db.conversation.update({
      where: { id: id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Add message error:', error)
    return NextResponse.json(
      { error: '添加消息失败' },
      { status: 500 }
    )
  }
}
