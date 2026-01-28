import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/conversations/[id] - 获取对话详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: '获取对话失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/conversations/[id] - 删除对话
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await db.conversation.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: '删除对话失败' },
      { status: 500 }
    )
  }
}
