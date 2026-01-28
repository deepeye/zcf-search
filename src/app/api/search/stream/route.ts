import { NextRequest } from 'next/server'
import { searchWeb } from '@/lib/search'
import { streamAnswer } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: '查询内容不能为空' },
        { status: 400 }
      )
    }

    // 执行搜索
    const sources = await searchWeb(query)

    if (sources.length === 0) {
      return Response.json({
        answer: '未找到相关信息,请尝试其他关键词。',
        sources: [],
      })
    }

    // 返回流式响应
    return streamAnswer(query, sources)
  } catch (error) {
    console.error('Search stream error:', error)
    return Response.json(
      { error: '搜索失败,请稍后重试' },
      { status: 500 }
    )
  }
}
