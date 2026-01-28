# Scira AI 克隆系统设计文档

**日期:** 2025-01-28
**项目:** ZCF Search - AI 搜索引擎平台
**类型:** 系统架构设计

## 1. 项目概述

### 1.1 项目目标
构建一个类似 Scira.ai 的 AI 搜索引擎,提供实时网络搜索、智能分析和多媒体内容展示功能。

### 1.2 核心功能
- 实时网络搜索与内容提取
- AI 驱动的答案生成(支持引用标注)
- 图片和视频内容展示
- 多轮对话支持
- 用户认证(Google/GitHub OAuth)
- 搜索历史与收藏管理
- 公开分享功能

### 1.3 目标用户
通用用户 - 类似 Perplexity,任何人都能用来快速搜索和学习新知识

## 2. 技术架构

### 2.1 整体架构

采用 Next.js 14+ App Router 的全栈架构:

**前端技术栈:**
- Next.js 14 (App Router) - 服务端渲染和路由
- React 18 - UI 框架
- TypeScript - 类型安全
- Tailwind CSS + shadcn/ui - UI 组件库
- Vercel AI SDK - AI 集成与流式响应

**后端技术栈:**
- Next.js API Routes - 服务端逻辑
- Prisma ORM - 数据库操作
- PostgreSQL - 主数据库
- Redis - 会话管理和缓存

**AI 和搜索服务:**
- OpenAI GPT-4 / Claude - 答案生成
- Tavily API - 网络搜索
- Jina Reader API - 网页内容提取
- Exa Search - 可选的语义搜索

**部署:**
- Vercel - 前端和 API 部署
- Supabase / Neon - PostgreSQL 托管
- Upstash - Redis 托管

### 2.2 数据模型

#### 用户表 (users)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())

  accounts      Account[]
  sessions      Session[]
  searches      Search[]
  conversations Conversation[]
  favorites     Favorite[]
}
```

#### 账户表 (accounts) - OAuth 关联
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String
  provider          String  // 'google' 或 'github'
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  @@unique([provider, providerAccountId])
}
```

#### 会话表 (sessions)
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
}
```

#### 搜索记录表 (searches)
```prisma
model Search {
  id              String   @id @default(cuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  query           String
  answer          String   @db.Text
  images          Json?    // 图片数组
  videos          Json?    // 视频数组
  sources         Json     @default("[]")
  createdAt       DateTime @default(now())
  conversationId  String?
  conversation    Conversation? @relation(fields: [conversationId], references: [id])
}
```

#### 对话表 (conversations)
```prisma
model Conversation {
  id          String    @id @default(cuid())
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])
  title       String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  searches    Search[]
}
```

#### 收藏表 (favorites)
```prisma
model Favorite {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  searchId    String
  query       String
  answer      String   @db.Text
  sources     Json
  createdAt   DateTime @default(now())
  note        String?  // 用户笔记
}
```

### 2.3 媒体数据结构

#### 图片数据
```typescript
interface MediaImage {
  url: string           // 图片 URL
  title: string         // 图片标题/描述
  source: string        // 来源网站
  thumbnail?: string    // 缩略图 URL
  width?: number        // 图片宽度
  height?: number       // 图片高度
}
```

#### 视频数据
```typescript
interface MediaVideo {
  url: string           // 视频 URL 或嵌入链接
  title: string         // 视频标题
  description: string   // 视频描述
  thumbnail: string     // 视频缩略图
  duration?: string     // 时长,如 "5:23"
  source: string        // 来源 (YouTube, Bilibili 等)
  embedUrl?: string     // 嵌入式播放 URL
}
```

## 3. API 设计

### 3.1 主要端点

#### 1. 搜索 API
```http
POST /api/search
Content-Type: application/json

{
  "query": "什么是量子计算?",
  "conversationId": "optional-uuid",
  "history": [] // 可选的对话历史
}

Response: text/event-stream (流式)
```

#### 2. 获取搜索历史
```http
GET /api/history?limit=20&offset=0
```

#### 3. 获取对话详情
```http
GET /api/conversation/[id]
```

#### 4. 收藏管理
```http
POST /api/favorites   # 添加收藏
GET /api/favorites    # 获取收藏列表
DELETE /api/favorites/[id]  # 删除收藏
```

#### 5. 分享功能
```http
GET /api/share/[id]  # 公开访问
```

### 3.2 核心搜索流程

```
用户提交查询
  ↓
API 验证输入
  ↓
并行调用搜索服务:
  - 网页搜索
  - 图片搜索
  - 视频搜索
  ↓
提取网页正文内容 (Jina Reader)
  ↓
构建提示词
  ↓
LLM 生成答案 (流式)
  ↓
返回流式响应:
  - 答案文本
  - 图片列表
  - 视频列表
  ↓
保存到数据库
```

### 3.3 提示词模板

```typescript
function buildPrompt(query: string, sources: Source[]) {
  return `
你是一个智能搜索助手。请基于以下搜索结果回答用户问题。

用户问题: ${query}

搜索结果:
${sources.map((s, i) => `
[${i+1}] ${s.title}
来源: ${s.url}
内容: ${s.content}
`).join('\n')}

要求:
1. 准确回答问题,优先使用搜索结果中的信息
2. 在相关句子后使用引用标记,如 [1][2]
3. 如果搜索结果不足,明确说明
4. 使用 Markdown 格式化回答
5. 保持简洁但全面
`
}
```

## 4. 前端设计

### 4.1 页面结构

#### 主页 (/)
- 居中搜索框
- 最近搜索历史(已登录用户)
- 简洁的引导文案

#### 搜索结果页 (/search/[query])
- 顶部: 固定搜索栏 + 用户头像
- 中间: 对话式答案展示区(流式输出 + Markdown)
- 右侧: 来源列表(可展开查看详细引用)
- 底部: 追问输入框
- 媒体区域: 图片和视频展示

#### 对话详情页 (/conversation/[id])
- 完整的多轮对话历史
- 支持继续对话
- 分享、收藏功能

### 4.2 核心组件

#### SearchInput
- 自动聚焦
- 快捷键支持 (Cmd+K)
- 搜索建议和历史记录

#### AnswerStream
- 流式渲染 AI 回答
- Markdown 渲染
- 代码高亮
- 引用标注 [1][2]

#### SourcesPanel
- 展示所有引用来源
- 网站图标 + 标题 + 摘要
- 点击跳转原始页面
- 可折叠/展开

#### MediaGallery
- 图片/视频标签页切换
- 图片网格展示
- 视频卡片列表
- 支持灯箱查看和嵌入式播放

#### ConversationView
- 多轮对话展示
- 用户消息和 AI 回答交替显示
- 时间戳
- 每条答案的来源展示

### 4.3 状态管理

使用 React Context + Server Actions:

```typescript
// app/context/search-context.tsx
export function SearchProvider({ children }) {
  const [currentSearch, setCurrentSearch] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [history, setHistory] = useState([])

  return (
    <SearchContext.Provider value={{...}}>
      {children}
    </SearchContext.Provider>
  )
}
```

## 5. 认证系统

### 5.1 OAuth 提供商

使用 Auth.js (NextAuth.js) v5:

- Google OAuth
- GitHub OAuth

### 5.2 配置

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

export const { handlers, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})
```

### 5.3 环境变量

```env
AUTH_SECRET=<your-secret-key>
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>

GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-client-secret>
```

## 6. 错误处理

### 6.1 错误边界

```typescript
// app/error.tsx
export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error-container">
      <h2>出错了</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

### 6.2 API 错误处理

```typescript
// lib/errors.ts
export class SearchError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'SearchError'
  }
}

export class RateLimitError extends Error {
  constructor() {
    super('搜索请求过于频繁,请稍后再试')
    this.name = 'RateLimitError'
  }
}
```

### 6.3 重试机制

```typescript
// lib/fetch-with-retry.ts
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; timeout?: number } = {}
): Promise<T> {
  const { maxRetries = 3, timeout = 10000 } = options

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await Promise.race([
        fn(),
        timeoutPromise(timeout)
      ])
      return result
    } catch (error) {
      if (i === maxRetries - 1) throw error

      const delay = Math.pow(2, i) * 1000 // 指数退避
      await sleep(delay)
    }
  }

  throw new Error('Max retries exceeded')
}
```

### 6.4 速率限制

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 每分钟10次
  analytics: true,
})

export async function checkRateLimit(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success, limit, remaining, reset } = await ratelimit.limit(ip)

  return {
    allowed: success,
    limit,
    remaining,
    reset
  }
}
```

## 7. 测试策略

### 7.1 测试层级

#### 单元测试 (Vitest)
- 提示词构建逻辑
- 速率限制
- 数据验证

#### 集成测试
- API 端点测试
- 数据库操作测试

#### 组件测试
- 搜索输入组件
- 答案流式渲染
- 媒体展示组件

#### E2E 测试
- 完整搜索流程
- 登录流程
- 历史记录和收藏

#### 性能测试
- 搜索响应时间
- 流式输出延迟

### 7.2 测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### 7.3 CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test && pnpm test:e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 8. 部署

### 8.1 Vercel 配置

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["sin1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 8.2 数据库部署

**推荐: Supabase**
```bash
supabase projects create zcf-search
supabase db push
```

**备选: Neon (无服务器)**
```bash
neonctl projects create --name zcf-search
pnpm prisma migrate deploy
```

### 8.3 Redis 部署

```bash
# Upstash
upstash redis create zcf-search --region us-east-1
upstash redis keys zcf-search
```

### 8.4 监控

- Vercel Analytics - 用户分析
- Vercel Speed Insights - 性能监控
- Sentry - 错误追踪

### 8.5 备份策略

```bash
# 每日自动备份
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
aws s3 cp backup_*.sql s3://zcf-search-backups/
```

## 9. 性能优化

### 9.1 Next.js 配置

```typescript
// next.config.js
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
}
```

### 9.2 成本追踪

```typescript
// lib/cost-tracking.ts
const API_COSTS = {
  'gpt-4': 0.03, // 每 1k tokens
  'tavily': 0.005, // 每次搜索
  'jina-reader': 0.001, // 每个页面
}

export function trackSearchCost(model, tokens, searchCount, pagesFetched) {
  const totalCost =
    (tokens / 1000) * API_COSTS[model] +
    searchCount * API_COSTS['tavily'] +
    pagesFetched * API_COSTS['jina-reader']

  logCostMetric({ totalCost, timestamp: new Date() })
  return totalCost
}
```

### 9.3 缓存策略

```typescript
// 静态资源缓存
export const revalidate = 3600 // 1 小时

// API 路由不缓存
export const dynamic = 'force-dynamic'
```

## 10. 安全

### 10.1 安全头

```typescript
// middleware.ts
export async function middleware(req: Request) {
  const res = NextResponse.next()

  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'; img-src 'self' data: https:;"
  )

  return res
}
```

### 10.2 环境变量管理

- 使用 Vercel 环境变量(生产环境)
- 本地 `.env.local` 文件(开发环境)
- 永不提交 `.env*` 文件到版本控制

## 11. 实施优先级

### Phase 1: MVP (核心功能)
- [ ] 基础搜索功能
- [ ] AI 答案生成
- [ ] 来源引用展示
- [ ] 基础 UI

### Phase 2: 增强功能
- [ ] OAuth 登录
- [ ] 搜索历史
- [ ] 多轮对话
- [ ] 图片和视频展示

### Phase 3: 完整功能
- [ ] 收藏功能
- [ ] 分享功能
- [ ] 用户设置
- [ ] 高级筛选

### Phase 4: 优化
- [ ] 性能优化
- [ ] 监控和分析
- [ ] 成本优化
- [ ] 扩展性改进

## 12. 成本估算

### 每月估算 (假设 1000 次搜索/天)

| 服务 | 单价 | 月用量 | 月成本 |
|------|------|--------|--------|
| Vercel Pro | $20/月 | 1 | $20 |
| Supabase | $25/月 | 1 | $25 |
| Upstash Redis | $10/月 | 1 | $10 |
| OpenAI GPT-4 | $0.03/1k tokens | 15M tokens | $450 |
| Tavily Search | $0.005/次 | 30,000 次 | $150 |
| Jina Reader | $0.001/页 | 90,000 页 | $90 |
| **总计** | - | - | **$745/月** |

### 优化方案
- 使用 GPT-3.5-turbo (降低 80% LLM 成本)
- 实施结果缓存 (减少 30% API 调用)
- 免费层服务 (Vercel Hobby, Supabase 免费层)

**优化后月成本: ~$150-200**

## 13. 未来扩展

- 移动应用 (React Native)
- 浏览器扩展
- API 开放平台
- 企业版本
- 多语言支持
- 个性化推荐
- 协作功能

## 14. 参考资料

- [Next.js 文档](https://nextjs.org/docs)
- [Auth.js v5](https://authjs.dev)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [Prisma 文档](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tavily API](https://tavily.com)
- [Jina Reader](https://jina.ai/reader)
