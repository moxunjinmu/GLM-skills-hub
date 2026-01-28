# API 设计文档

## RESTful API 设计

### 基础路径

```
/api/v1
```

### 通用响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": T,
  "message": string
}

// 错误响应
{
  "success": false,
  "error": {
    "code": string,
    "message": string
  }
}
```

---

## Skills API

### 获取 Skills 列表

```
GET /api/v1/skills
```

**Query 参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |
| category | string | 分类筛选 |
| tags | string | 标签筛选，逗号分隔 |
| sort | string | 排序方式: stars/latest/rating |
| search | string | 搜索关键词 |
| featured | boolean | 是否只显示精选 |

**响应:**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": "clxxx",
        "name": "vercel-react-best-practices",
        "nameZh": "Vercel React 最佳实践",
        "slug": "vercel-react-best-practices",
        "description": "...",
        "descriptionZh": "...",
        "repository": "anthropics/skills",
        "author": "anthropics",
        "stars": 12500,
        "rating": 4.8,
        "categories": ["开发工具"],
        "tags": ["React", "Next.js"]
      }
    ],
    "pagination": {
      "total": 1000,
      "page": 1,
      "limit": 20,
      "totalPages": 50
    }
  }
}
```

### 获取 Skill 详情

```
GET /api/v1/skills/:slug
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "name": "vercel-react-best-practices",
    "nameZh": "Vercel React 最佳实践",
    "slug": "vercel-react-best-practices",
    "description": "...",
    "descriptionZh": "...",
    "repository": "anthropics/skills",
    "author": "anthropics",
    "stars": 12500,
    "forks": 1200,
    "rating": 4.8,
    "ratingCount": 256,
    "viewCount": 12500,
    "usageCount": 3200,
    "categories": [...],
    "tags": [...],
    "installCommand": "npx skills add anthropics/skills",
    "skillMdContent": "...",
    "readmeContent": "...",
    "isOfficial": true,
    "isVerified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-28T00:00:00Z"
  }
}
```

---

## 搜索 API

### 搜索 Skills

```
GET /api/v1/search
```

**Query 参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索查询 |
| type | string | 搜索类型: keyword/semantic |
| page | number | 页码 |
| limit | number | 每页数量 |

**响应:**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "suggestions": ["React", "Next.js", "TypeScript"],
    "pagination": {...}
  }
}
```

---

## 分类 API

### 获取分类列表

```
GET /api/v1/categories
```

### 获取分类下的 Skills

```
GET /api/v1/categories/:slug/skills
```

---

## 用户 API

### GitHub OAuth 登录

```
POST /api/v1/auth/github
```

**请求体:**
```json
{
  "code": "github_oauth_code"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx",
      "name": "张三",
      "email": "zhangsan@example.com",
      "avatar": "https://...",
      "credits": 100
    },
    "token": "jwt_token"
  }
}
```

### 获取用户信息

```
GET /api/v1/user/me
```

**Headers:**
```
Authorization: Bearer {token}
```

---

## 收藏 API

### 添加收藏

```
POST /api/v1/favorites
```

**请求体:**
```json
{
  "skillId": "clxxx"
}
```

### 取消收藏

```
DELETE /api/v1/favorites/:skillId
```

### 获取收藏列表

```
GET /api/v1/favorites
```

---

## 评论 API

### 创建评论

```
POST /api/v1/skills/:slug/reviews
```

**请求体:**
```json
{
  "rating": 5,
  "content": "非常好用的 Skill！"
}
```

### 获取评论列表

```
GET /api/v1/skills/:slug/reviews
```

---

## 试用 API

### 在线试用 Skill

```
POST /api/v1/skills/:slug/trial
```

**请求体:**
```json
{
  "prompt": "帮我检查这段代码的性能问题"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "result": "...",
    "creditsUsed": 5,
    "remainingCredits": 95
  }
}
```

---

## 贡献 API

### 提交翻译

```
POST /api/v1/translations
```

**请求体:**
```json
{
  "skillId": "clxxx",
  "field": "description",
  "contentZh": "中文翻译"
}
```

### 提交新 Skill

```
POST /api/v1/contributions/skills
```

**请求体:**
```json
{
  "repository": "https://github.com/xxx/skills",
  "name": "skill-name",
  "description": "..."
}
```

---

## 管理员 API

### 审核贡献

```
PUT /api/v1/admin/contributions/:id
```

**请求体:**
```json
{
  "status": "approved"
}
```

### 同步 Skills

```
POST /api/v1/admin/sync
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |
| 1001 | 积分不足 |
| 1002 | Skill 不支持试用 |
| 1003 | GitHub API 配额超限 |
