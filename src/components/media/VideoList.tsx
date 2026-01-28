'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Play } from 'lucide-react'

interface MediaVideo {
  url: string
  title: string
  description: string
  thumbnail: string
  source: string
}

interface VideoListProps {
  videos: MediaVideo[]
}

export function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        相关视频 ({videos.length})
      </h3>
      <div className="space-y-3">
        {videos.map((video, index) => (
          <a
            key={index}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 relative w-32 h-20 bg-muted rounded flex items-center justify-center">
                    <Play className="h-8 w-8 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      {video.title}
                      <ExternalLink className="h-3 w-3" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
