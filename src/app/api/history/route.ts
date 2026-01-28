import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/history - 获取用户的搜索历史
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const searches = await db.search.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.search.count({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      searches,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { error: '获取搜索历史失败' },
      { status: 500 }
    )
  }
}
