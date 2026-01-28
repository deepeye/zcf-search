export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface MediaImage {
  url: string
  title: string
  source: string
  thumbnail?: string
}

export interface MediaVideo {
  url: string
  title: string
  description: string
  thumbnail: string
  duration?: string
  source: string
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

export async function searchImages(query: string): Promise<MediaImage[]> {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not set')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: query,
      search_depth: 'basic',
      max_results: 5,
      include_images: true,
      include_answer: false,
      include_raw_content: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Image search failed: ${response.statusText}`)
  }

  const data = await response.json()

  return (data.images || []).map((img: any) => ({
    url: img.url,
    title: img.description || 'Image',
    source: img.url,
  }))
}

export async function searchVideos(
  query: string
): Promise<MediaVideo[]> {
  // Tavily 不直接支持视频搜索，这里返回空数组
  // 实际项目中可以集成 YouTube API 或其他视频搜索 API
  return []
}
