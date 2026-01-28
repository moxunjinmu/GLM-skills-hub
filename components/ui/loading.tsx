import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

interface LoadingCardProps {
  count?: number
}

export function LoadingCardGrid({ count = 6 }: LoadingCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border rounded-lg p-6 space-y-4 animate-pulse"
        >
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="flex gap-2 pt-4">
            <div className="h-8 bg-muted rounded flex-1" />
            <div className="h-8 bg-muted rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FullPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  )
}
