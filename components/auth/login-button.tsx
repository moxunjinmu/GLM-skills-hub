'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, User } from 'lucide-react'

export function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="w-4 h-4 mr-2" />
        加载中...
      </Button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {session.user?.name || session.user?.email}
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          退出
        </Button>
      </div>
    )
  }

  return (
    <Button size="sm" onClick={() => signIn('github')}>
      <LogIn className="w-4 h-4 mr-2" />
      GitHub 登录
    </Button>
  )
}
