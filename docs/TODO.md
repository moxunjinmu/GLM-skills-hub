# TODO - 开发任务清单

> 最后更新: 2025-02-01

## 🟢 已完成

### GitHub 登录功能
- [x] NextAuth 配置 (`lib/auth/config.ts`)
- [x] API 路由 (`app/api/auth/[...nextauth]/route.ts`)
- [x] Prisma 数据模型 (User/Account/Session/VerificationToken)
- [x] SessionProvider (`components/providers/session-provider.tsx`)
- [x] 登录按钮组件 (`components/auth/login-button.tsx`)
- [x] 登录页面 (`app/auth/signin/page.tsx`)
- [x] 错误页面 (`app/auth/error/page.tsx`)
- [x] TypeScript 类型定义 (`types/next-auth.d.ts`)
- [x] 根布局集成 Providers (`app/layout.tsx`)

**注意**: 需要配置 GitHub OAuth App 凭据才能使用。参见 [GitHub 登录配置指南](./GITHUB_LOGIN_SETUP.md)

---

## 🔴 高优先级（影响核心功能）

### 待开发功能

| 任务 | 描述 | 文件位置 |
|------|------|---------|
| **收藏功能** | 用户收藏 Skills 的 API 和前端实现 | `components/skill/skill-actions.tsx` |
| **积分消费系统** | 试用技能时扣除积分，记录使用日志 | 需新建 API |
| **在线试用功能** | 与 Claude API 对接的试用界面 | 需新建组件和 API |
| **热门榜单系统** | 基于多源热度（GitHub Stars + 站内数据）的排名算法 | 需新建 API |
| **嵌入向量优化** | 语义搜索的嵌入向量应预存到数据库 | `lib/search/search-service.ts:178` |

---

## 🟡 中优先级（增强用户体验）

| 任务 | 描述 |
|------|------|
| **搜索建议功能** | 输入时实时展示搜索建议和热门搜索 |
| **技能评分系统** | 用户可对 Skills 评分和评论 |
| **用户个人中心** | 展示积分、收藏、历史、提交记录 |
| **提交审核工作流** | 管理员审核用户提交的 Skills 和翻译 |
| **通知系统** | 审核结果、评论回复等通知 |

---

## 🟢 低优先级（锦上添花）

| 任务 | 描述 |
|------|------|
| **签到奖励** | 每日签到获取积分 |
| **分享功能** | 分享 Skills 到社交平台获取积分 |
| **多语言支持** | i18n 国际化（中英切换） |
| **移动端适配** | 响应式布局优化 |

---

## 🔧 性能优化

- [ ] 添加 Redis 缓存热门数据和搜索结果
- [ ] 图片懒加载
- [ ] 组件代码分割
- [ ] SWR/React Query 数据缓存
- [ ] 动态生成 Open Graph 标签
- [ ] Sitemap 自动生成

---

## 📁 待新建的关键文件

```
app/
├── api/
│   ├── favorites/          # 收藏 API
│   ├── trials/             # 在线试用 API
│   ├── rankings/           # 热门榜单 API
│   └── notifications/      # 通知 API
├── rankings/              # 榜单页面
├── try/[slug]/            # 试用页面
├── me/                    # 个人中心
└── admin/                 # 管理后台

components/
├── trial/                 # 试用相关组件
├── rankings/              # 榜单组件
├── user/                  # 用户中心组件
└── notifications/         # 通知组件
```
