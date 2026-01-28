'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { UserButton } from '@/components/auth/UserButton'
import { SignInButton } from '@/components/auth/SignInButton'
import { MobileNav } from '@/components/MobileNav'
import { MessageSquare, History } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="text-xl font-bold">
            ZCF Search
          </Link>
          {session && (
            <nav className="hidden md:flex gap-4">
              <Link href="/conversations">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  对话
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  历史
                </Button>
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          {session?.user ? <UserButton /> : <SignInButton />}
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
