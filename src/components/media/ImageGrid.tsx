'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

interface MediaImage {
  url: string
  title: string
  source: string
}

interface ImageGridProps {
  images: MediaImage[]
}

export function ImageGrid({ images }: ImageGridProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        相关图片 ({images.length})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((image, index) => (
          <a
            key={index}
            href={image.source}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end">
                  <div className="p-2 bg-black/60 text-white text-xs w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{image.title}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
