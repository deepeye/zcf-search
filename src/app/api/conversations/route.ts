import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/conversations - 获取用户的所有对话
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const conversations = await db.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: '获取对话列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/conversations - 创建新对话
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { title, query, answer, sources } = await request.json()

    const conversation = await db.conversation.create({
      data: {
        title: title || query.substring(0, 50),
        userId: session.user.id,
        messages: {
          create: [
            {
              role: 'user',
              content: query,
            },
            {
              role: 'assistant',
              content: answer,
              sources: sources || [],
            },
          ],
        },
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: '创建对话失败' },
      { status: 500 }
    )
  }
}
