export interface SearchResult {
  title: string
  url: string
  content: string
  score?: number
}

export interface SearchResponse {
  answer: string
  sources: SearchResult[]
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
