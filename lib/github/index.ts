/**
 * GitHub API 客户端
 * 用于获取仓库信息和文件内容
 */
import { Octokit } from 'octokit'

const githubToken = process.env.GITHUB_TOKEN

if (!githubToken) {
  console.warn('GITHUB_TOKEN is not set. GitHub API requests will be rate limited.')
}

export const github = new Octokit({
  auth: githubToken,
})

/**
 * GitHub API 相关工具函数
 */
export const githubApi = {
  /**
   * 获取仓库信息
   */
  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await github.rest.repos.get({
        owner,
        repo,
      })
      return data
    } catch (error) {
      console.error(`Failed to get repository ${owner}/${repo}:`, error)
      throw error
    }
  },

  /**
   * 获取仓库的 README
   */
  async getReadme(owner: string, repo: string) {
    try {
      const { data } = await github.rest.repos.getReadme({
        owner,
        repo,
      })
      // README 内容是 base64 编码的
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return content
    } catch (error) {
      console.error(`Failed to get README for ${owner}/${repo}:`, error)
      return null
    }
  },

  /**
   * 获取文件内容
   */
  async getFileContent(owner: string, repo: string, path: string) {
    try {
      const { data } = await github.rest.repos.getContent({
        owner,
        repo,
        path,
      })
      if ('content' in data && data.type === 'file') {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
      return null
    } catch (error) {
      console.error(`Failed to get file ${path} from ${owner}/${repo}:`, error)
      return null
    }
  },

  /**
   * 搜索代码仓库
   */
  async searchRepositories(query: string, perPage = 100, page = 1) {
    try {
      const { data } = await github.rest.search.repos({
        q: query,
        per_page: perPage,
        page,
      })
      return data
    } catch (error) {
      console.error('Failed to search repositories:', error)
      throw error
    }
  },

  /**
   * 搜索代码（用于查找 SKILL.md 文件）
   */
  async searchCode(query: string, perPage = 100, page = 1) {
    try {
      const { data } = await github.rest.search.code({
        q: query,
        per_page: perPage,
        page,
      })
      return data
    } catch (error) {
      console.error('Failed to search code:', error)
      throw error
    }
  },
}
