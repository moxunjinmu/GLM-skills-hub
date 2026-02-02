/**
 * 核心类型定义
 */

// ==================== Skill 类型 ====================

export interface Skill {
  id: string
  name: string
  nameZh: string | null
  slug: string
  description: string
  descriptionZh: string | null
  repository: string
  author: string
  authorId: string | null
  stars: number
  forks: number
  openIssues: number
  lastCommit: Date | null
  createdAt: Date
  updatedAt: Date
  syncedAt: Date
  categories: Category[]
  tags: Tag[]
  viewCount: number
  usageCount: number
  rating: number
  ratingCount: number
  installCommand: string | null
  skillMdContent: string | null
  skillMdContentZh: string | null
  readmeContent: string | null
  readmeContentZh: string | null
  marketplaceJson: Record<string, unknown> | null
  isOfficial: boolean
  isVerified: boolean
  isActive: boolean
  featured: boolean
}

export type SkillInput = Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'>

// ==================== Category 类型 ====================

export interface Category {
  id: string
  name: string
  nameZh: string
  slug: string
  icon: string
  color: string | null
  description: string | null
  order: number
  isActive: boolean
}

export type CategoryInput = Omit<Category, 'id'>

// ==================== Tag 类型 ====================

export interface Tag {
  id: string
  name: string
  nameZh: string
  slug: string
  type: TagType
}

export enum TagType {
  TECH_STACK = 'TECH_STACK',
  USE_CASE = 'USE_CASE',
  LANGUAGE = 'LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
}

// ==================== User 类型 ====================

export interface User {
  id: string
  githubId: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  credits: number
  createdAt: Date
  lastSignInAt: Date
}

// ==================== Review 类型 ====================

export interface Review {
  id: string
  rating: number
  content: string | null
  userId: string
  skillId: string
  createdAt: Date
  updatedAt: Date
}

// ==================== Translation 类型 ====================

export interface Translation {
  id: string
  skillId: string
  field: string
  contentEn: string
  contentZh: string
  userId: string
  status: TranslationStatus
  createdAt: Date
  updatedAt: Date
}

export enum TranslationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: 'stars' | 'latest' | 'rating' | 'popular'
  order?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==================== 搜索类型 ====================

export interface SearchParams extends PaginationParams {
  q: string
  category?: string
  tags?: string[]
  author?: string
  language?: string
  minStars?: number
}

export interface SearchResult {
  id: string
  name: string
  nameZh: string | null
  slug: string
  description: string
  descriptionZh: string | null
  repository: string
  author: string
  stars: number
  forks: number
  openIssues: number
  lastCommit: Date | null
  createdAt: Date
  updatedAt: Date
  syncedAt: Date
  categories: Category[]
  tags: Tag[]
  viewCount: number
  usageCount: number
  rating: number
  ratingCount: number
  installCommand: string | null
  skillMdContent: string | null
  skillMdContentZh: string | null
  readmeContent: string | null
  readmeContentZh: string | null
  marketplaceJson: Record<string, unknown> | null
  isOfficial: boolean
  isVerified: boolean
  isActive: boolean
  featured: boolean
}

export interface SearchResponse {
  skills: SearchResult[]
  suggestions: string[]
  pagination: PaginationResult<SearchResult>
}

// ==================== Skill 解析类型 ====================

export interface SkillMetadata {
  name: string
  description: string
  author?: string
  version?: string
  tags?: string[]
  trigger?: string[]
  categories?: string[]
  usage?: string
  examples?: string[]
}

export interface ParsedSkill {
  metadata: SkillMetadata
  content: string
  installCommand?: string
  marketplaceJson?: Record<string, unknown>
}

// ==================== 统计类型 ====================

export interface Stats {
  totalSkills: number
  totalUsers: number
  totalUsage: number
  totalTranslations: number
}
