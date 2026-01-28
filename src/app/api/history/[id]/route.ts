import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE /api/history/[id] - 删除单条搜索历史
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await db.search.deleteMany({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete history error:', error)
    return NextResponse.json(
      { error: '删除历史记录失败' },
      { status: 500 }
    )
  }
}
