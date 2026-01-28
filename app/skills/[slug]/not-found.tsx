import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        抱歉，找不到这个 Skill
      </p>
      <div className="flex items-center justify-center gap-4">
        <Button asChild>
          <Link href="/skills">浏览 Skills</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </div>
  )
}
