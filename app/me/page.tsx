import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { UserProfile } from '@/components/user/user-profile'

export const dynamic = 'force-dynamic'

type TabType = 'overview' | 'favorites' | 'history' | 'reviews' | 'credits'

interface MePageProps {
  searchParams: Promise<{ tab?: TabType }>
}

/**
 * 用户个人中心页面
 */
export default async function MePage({ searchParams }: MePageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/me')
  }

  const awaitedParams = await Promise.resolve(searchParams)
  const tab = awaitedParams.tab || 'overview'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <UserProfile userId={session.user.id} initialTab={tab} />
    </div>
  )
}
