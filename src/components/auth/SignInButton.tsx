'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function SignInButton() {
  const handleSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/' })
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleSignIn('google')}
        variant="outline"
        className="flex-1"
      >
        使用 Google 登录
      </Button>
      <Button
        onClick={() => handleSignIn('github')}
        variant="outline"
        className="flex-1"
      >
        使用 GitHub 登录
      </Button>
    </div>
  )
}
