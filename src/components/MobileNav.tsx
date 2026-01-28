'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Menu, X, MessageSquare, History } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  if (!session) return null

  return (
    <>
      {/* 菜单按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* 移动端侧边栏 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          {/* 侧边栏内容 */}
          <div className="fixed right-0 top-0 h-full w-64 bg-background p-6 shadow-lg">
            <nav className="space-y-4">
              <Link
                href="/conversations"
                className="flex items-center gap-2 text-lg font-medium"
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare className="h-5 w-5" />
                对话
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-2 text-lg font-medium"
                onClick={() => setIsOpen(false)}
              >
                <History className="h-5 w-5" />
                历史
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
