import { prisma } from '@/lib/db'

/**
 * 创建通知的辅助函数
 */
export async function createNotification(params: {
  userId: string
  type: 'REVIEW_APPROVED' | 'REVIEW_REJECTED' | 'COMMENT_REPLY' | 'CREDIT_EARNED' | 'SYSTEM_NOTICE'
  title: string
  content: string
  metadata?: any
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      content: params.content,
      metadata: params.metadata,
    },
  })
}

/**
 * 通知类型标签
 */
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    REVIEW_APPROVED: '审核通过',
    REVIEW_REJECTED: '审核拒绝',
    COMMENT_REPLY: '评论回复',
    CREDIT_EARNED: '获得积分',
    SYSTEM_NOTICE: '系统通知',
  }
  return labels[type] || type
}

/**
 * 获取通知图标
 */
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    REVIEW_APPROVED: '✅',
    REVIEW_REJECTED: '❌',
    COMMENT_REPLY: '💬',
    CREDIT_EARNED: '💰',
    SYSTEM_NOTICE: '📢',
  }
  return icons[type] || '🔔'
}
