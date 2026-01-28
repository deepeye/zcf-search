import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAnswer(
  query: string,
  sources: Array<{ title: string; content: string; url: string }>
): Promise<string> {
  const prompt = buildPrompt(query, sources)

  const { text } = await generateText({
    model: openai('gpt-4'),
    prompt,
    temperature: 0.7,
  })

  return text
}

function buildPrompt(
  query: string,
  sources: Array<{ title: string; content: string; url: string }>
): string {
  const sourcesText = sources
    .map(
      (s, i) => `
[${i + 1}] ${s.title}
URL: ${s.url}
内容: ${s.content}
`
    )
    .join('\n')

  return `你是一个智能搜索助手。请基于以下搜索结果回答用户问题。

用户问题: ${query}

搜索结果:
${sourcesText}

要求:
1. 准确回答问题,优先使用搜索结果中的信息
2. 在相关句子后使用引用标记,如 [1][2]
3. 如果搜索结果不足,明确说明
4. 使用 Markdown 格式化回答
5. 保持简洁但全面

答案:`
}
