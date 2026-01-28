'use client'

import { ImageGrid } from '@/components/media/ImageGrid'
import { VideoList } from '@/components/media/VideoList'

interface MediaGalleryProps {
  images?: Array<{ url: string; title: string; source: string }>
  videos?: Array<{
    url: string
    title: string
    description: string
    thumbnail: string
    source: string
  }>
}

export function MediaGallery({
  images = [],
  videos = [],
}: MediaGalleryProps) {
  if (images.length === 0 && videos.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <ImageGrid images={images} />
      {videos.length > 0 && <VideoList videos={videos} />}
    </div>
  )
}
