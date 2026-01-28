'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        <h2 className="text-2xl font-bold">出错了</h2>

        <p className="text-muted-foreground">
          {error?.message || '页面加载时发生错误，请稍后重试。'}
        </p>

        <div className="flex justify-center gap-3">
          <Button onClick={resetError} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              错误详情
            </summary>
            <pre className="mt-2 text-xs bg-muted p-4 rounded-lg overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || ErrorFallback
      return <Fallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

interface ApiErrorProps {
  message?: string
  onRetry?: () => void
}

export function ApiError({ message = '请求失败，请稍后重试', onRetry }: ApiErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {icon || <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">📭</span>
      </div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
