export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not set')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: 10,
    }),
  })

  if (!response.ok) {
    throw new Error(`Search API failed: ${response.statusText}`)
  }

  const data = await response.json()

  return data.results.map((result: any) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
  }))
}
