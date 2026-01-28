import { NextRequest, NextResponse } from 'next/server'
import { searchWeb } from '@/lib/search'
import { generateAnswer } from '@/lib/ai'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '查询内容不能为空' },
        { status: 400 }
      )
    }

    const sources = await searchWeb(query)

    if (sources.length === 0) {
      return NextResponse.json({
        answer: '未找到相关信息,请尝试其他关键词。',
        sources: [],
      })
    }

    const answer = await generateAnswer(query, sources)

    await db.search.create({
      data: {
        query,
        answer,
        sources: sources.map((s) => ({
          title: s.title,
          url: s.url,
          content: s.content,
        })),
      },
    })

    return NextResponse.json({
      answer,
      sources: sources.map((s) => ({
        title: s.title,
        url: s.url,
        content: s.content,
      })),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: '搜索失败,请稍后重试' },
      { status: 500 }
    )
  }
}
