import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { TrialInterface } from '@/components/trial/trial-interface'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface TrialPageProps {
  params?: Promise<{
    slug: string
  }>
}

/**
 * 试用页面
 */
export default async function TrialPage({ params }: TrialPageProps) {
  const session = await auth()
  const resolvedParams = await params

  if (!resolvedParams?.slug) {
    notFound()
  }

  const slug = resolvedParams.slug

  // 获取技能信息
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      categories: true,
      tags: true,
    },
  })

  if (!skill) {
    notFound()
  }

  // 检查用户是否登录
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/try/${slug}`)
  }

  // 获取用户积分
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <TrialInterface
        skill={skill}
        userCredits={user?.credits || 0}
        userId={session.user.id}
      />
    </div>
  )
}
