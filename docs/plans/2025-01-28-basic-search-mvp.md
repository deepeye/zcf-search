# 基础搜索 MVP 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 构建一个功能完整的 AI 搜索引擎 MVP,支持实时网络搜索、AI 答案生成、来源引用展示

**架构:** 使用 Next.js 14 App Router + Vercel AI SDK 构建全栈应用,采用 Server Actions 和流式响应实现实时搜索体验

**技术栈:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Vercel AI SDK, Prisma, Tavily API, OpenAI API

---

## 前置准备

### Task 0: 项目初始化

**目标:** 设置 Next.js 项目并安装所有必要依赖

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Step 1: 初始化 Next.js 项目**

```bash
cd .worktrees/basic-search
npx create-next-app@latest . --typescript --tailwind --app --no-src --import-alias "@/*" --use-npm
```

运行命令并接受所有默认选项。

**Step 2: 安装核心依赖**

```bash
npm install ai openai @ai-sdk/openai
npm install @prisma/client
npm install -D prisma
npm install next-auth@beta
npm install class-variance-authority clsx tailwind-merge
```

**Step 3: 安装 shadcn/ui**

```bash
npx shadcn-ui@latest init
```

接受默认配置(Tailwind CSS, CSS variables, slate 颜色)。

**Step 4: 添加 shadcn/ui 组件**

```bash
npx shadcn-ui@latest add button input card alert
```

**Step 5: 安装额外依赖**

```bash
npm install lucide-react react-markdown
```

**Step 6: 验证项目运行**

```bash
npm run dev
```

访问 http://localhost:3000,确保看到 Next.js 欢迎页面。

**Step 7: 停止开发服务器并提交**

```bash
git add .
git commit -m "feat: 初始化 Next.js 项目

- 安装 Next.js 14 + TypeScript
- 配置 Tailwind CSS
- 添加 shadcn/ui 组件库
- 配置 Vercel AI SDK
- 配置 Prisma ORM

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 数据库设置

### Task 1: 配置 Prisma 和数据库

**目标:** 设置数据库 schema 和连接

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env`
- Modify: `.gitignore`

**Step 1: 创建 Prisma schema**

创建 `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Search {
  id        String   @id @default(cuid())
  query     String
  answer    String   @db.Text
  sources   Json     @default("[]")
  createdAt DateTime @default(now())
}
```

**Step 2: 创建环境变量文件**

创建 `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zcf_search?schema=public"

# API Keys (稍后配置)
OPENAI_API_KEY=""
TAVILY_API_KEY=""
```

**Step 3: 更新 .gitignore**

在 `.gitignore` 末尾添加(如果还没有):

```
# Local env files
.env
.env*.local
```

**Step 4: 生成 Prisma Client**

```bash
npx prisma generate
```

**Step 5: 提交**

```bash
git add prisma/schema.prisma .env .gitignore
git commit -m "feat: 添加 Prisma schema

- 定义 Search 模型
- 配置数据库连接
- 添加环境变量模板

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 核心功能实现

### Task 2: 创建工具函数库

**目标:** 创建可复用的工具函数

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/lib/db.ts`

**Step 1: 创建 utils.ts**

创建 `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 2: 创建 db.ts**

创建 `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**Step 3: 提交**

```bash
git add src/lib/utils.ts src/lib/db.ts
git commit -m "feat: 添加工具函数

- 添加 cn() 用于 className 合并
- 创建数据库客户端单例

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

### Task 3: 实现搜索服务

**目标:** 创建与 Tavily API 集成的搜索服务

**Files:**
- Create: `src/lib/search.ts`
- Create: `src/lib/types.ts`

**Step 1: 定义类型**

创建 `src/lib/types.ts`:

```typescript
export interface SearchResult {
  title: string
  url: string
  content: string
  score?: number
}

export interface SearchResponse {
  answer: string
  sources: SearchResult[]
}

export interface MediaImage {
  url: string
  title: string
  source: string
  thumbnail?: string
}

export interface MediaVideo {
  url: string
  title: string
  description: string
  thumbnail: string
  duration?: string
  source: string
}
```

**Step 2: 创建搜索服务**

创建 `src/lib/search.ts`:

```typescript
import { TavilySearchResults } from '@tavily/sdk'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

export async function searchWeb(query: string): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is not set')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      search_depth: 'basic',
      max_results: 10,
    }),
  })

  if (!response.ok) {
    throw new Error(`Search API failed: ${response.statusText}`)
  }

  const data: TavilySearchResults = await response.json()

  return data.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
  }))
}
```

**Step 3: 提交**

```bash
git add src/lib/types.ts src/lib/search.ts
git commit -m "feat: 添加搜索服务

- 集成 Tavily Search API
- 定义搜索结果类型
- 实现 searchWeb 函数

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

### Task 4: 实现 AI 答案生成

**目标:** 使用 OpenAI API 生成答案

**Files:**
- Create: `src/lib/ai.ts`

**Step 1: 创建 AI 服务**

创建 `src/lib/ai.ts`:

```typescript
import { OpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAnswer(
  query: string,
  sources: Array<{ title: string; content: string; url: string }>
): Promise<string> {
  const prompt = buildPrompt(query, sources)

  const { text } = await generateText({
    model: openai('gpt-4'),
    prompt,
    temperature: 0.7,
    maxTokens: 2000,
  })

  return text
}

function buildPrompt(
  query: string,
  sources: Array<{ title: string; content: string; url: string }>
): string {
  const sourcesText = sources
    .map(
      (s, i) => `
[${i + 1}] ${s.title}
URL: ${s.url}
内容: ${s.content}
`
    )
    .join('\n')

  return `你是一个智能搜索助手。请基于以下搜索结果回答用户问题。

用户问题: ${query}

搜索结果:
${sourcesText}

要求:
1. 准确回答问题,优先使用搜索结果中的信息
2. 在相关句子后使用引用标记,如 [1][2]
3. 如果搜索结果不足,明确说明
4. 使用 Markdown 格式化回答
5. 保持简洁但全面

答案:`
}
```

**Step 2: 提交**

```bash
git add src/lib/ai.ts
git commit -m "feat: 添加 AI 答案生成服务

- 集成 OpenAI GPT-4
- 实现提示词构建
- 添加引用标记支持

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

### Task 5: 创建 API 路由

**目标:** 实现 /api/search 端点

**Files:**
- Create: `src/app/api/search/route.ts`

**Step 1: 创建搜索 API**

创建 `src/app/api/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { searchWeb } from '@/lib/search'
import { generateAnswer } from '@/lib/ai'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '查询内容不能为空' },
        { status: 400 }
      )
    }

    // 执行搜索
    const sources = await searchWeb(query)

    if (sources.length === 0) {
      return NextResponse.json({
        answer: '未找到相关信息,请尝试其他关键词。',
        sources: [],
      })
    }

    // 生成答案
    const answer = await generateAnswer(query, sources)

    // 保存到数据库
    await db.search.create({
      data: {
        query,
        answer,
        sources: sources.map((s) => ({
          title: s.title,
          url: s.url,
          content: s.content,
        })),
      },
    })

    return NextResponse.json({
      answer,
      sources: sources.map((s) => ({
        title: s.title,
        url: s.url,
        content: s.content,
      })),
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: '搜索失败,请稍后重试' },
      { status: 500 }
    )
  }
}
```

**Step 2: 提交**

```bash
git add src/app/api/search/route.ts
git commit -m "feat: 添加搜索 API 端点

- 实现 POST /api/search
- 集成搜索和 AI 生成
- 添加错误处理
- 保存搜索历史到数据库

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

### Task 6: 创建搜索输入组件

**目标:** 构建可复用的搜索输入框

**Files:**
- Create: `src/components/SearchInput.tsx`

**Step 1: 创建 SearchInput 组件**

创建 `src/components/SearchInput.tsx`:

```typescript
'use client'

import { useState, FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function SearchInput({
  onSearch,
  isLoading = false,
  placeholder = '搜索任何内容...',
}: SearchInputProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="pl-10 pr-20 h-12 text-lg"
        />
        <Button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 h-8 -translate-y-1/2"
        >
          {isLoading ? '搜索中...' : '搜索'}
        </Button>
      </div>
    </form>
  )
}
```

**Step 2: 提交**

```bash
git add src/components/SearchInput.tsx
git commit -m "feat: 添加搜索输入组件

- 创建 SearchInput 组件
- 支持加载状态
- 添加搜索图标
- 实现表单提交

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

### Task 7: 创建答案展示组件

**目标:** 展示 AI 生成的答案

**Files:**
- Create: `src/components/AnswerDisplay.tsx`

**Step 1: 创建 AnswerDisplay 组件**

创建 `src/components/AnswerDisplay.tsx`:

```typescript
'use client'

import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/card'

interface AnswerDisplayProps {
  answer: string
  isLoading?: boolean
}

export function AnswerDisplay({ answer, isLoading }: AnswerDisplayProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </Card>
    )
  }

  if (!answer) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
    </Card>
  )
}
```

**Step 2: 提交**

```bash
git add src/components/AnswerDisplay.tsx
git commit -m "feat: 添加答案展示组件

- 创建 AnswerDisplay 组件
- 支持 Markdown 渲染
- 添加加载骨架屏
- 使用 prose 样式

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

### Task 8: 创建来源列表组件

**目标:** 展示搜索来源

**Files:**
- Create: `src/components/SourcesList.tsx`

**Step 1: 创建 SourcesList 组件**

创建 `src/components/SourcesList.tsx`:

```typescript
'use client'

import { ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Source {
  title: string
  url: string
  content: string
}

interface SourcesListProps {
  sources: Source[]
}

export function SourcesList({ sources }: SourcesListProps) {
  if (sources.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        来源 ({sources.length})
      </h3>
      {sources.map((source, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                {index + 1}
              </Badge>
              <div className="flex-1 min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {source.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {source.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

**Step 2: 提交**

```bash
git add src/components/SourcesList.tsx
git commit -m "feat: 添加来源列表组件

- 创建 SourcesList 组件
- 显示搜索来源
- 支持外部链接
- 添加序号标记

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

### Task 9: 创建主页面

**目标:** 集成所有组件,构建完整的主页

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: 替换主页内容**

替换 `src/app/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { SourcesList } from '@/components/SourcesList'

interface SearchResult {
  answer: string
  sources: Array<{
    title: string
    url: string
    content: string
  }>
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '搜索失败')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">ZCF Search</h1>
          <p className="text-muted-foreground">
            AI 驱动的智能搜索引擎
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <SearchInput
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="搜索任何内容..."
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Answer */}
            <div className="lg:col-span-2">
              <AnswerDisplay answer={result.answer} isLoading={isLoading} />
            </div>

            {/* Sources */}
            <div>
              <SourcesList sources={result.sources} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

**Step 2: 添加 Badge 组件**

```bash
npx shadcn-ui@latest add badge
```

**Step 3: 提交**

```bash
git add src/app/page.tsx
git commit -m "feat: 实现主页搜索功能

- 集成搜索、答案展示、来源组件
- 添加加载和错误状态
- 实现响应式布局
- 添加渐变背景

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 测试与验证

### Task 10: 本地测试

**目标:** 验证所有功能正常工作

**Files:**
- None (运行测试)

**Step 1: 配置环境变量**

在 `.env` 中填入真实的 API 密钥:

```bash
OPENAI_API_KEY="sk-your-openai-key"
TAVILY_API_KEY="tvly-your-tavily-key"
```

**Step 2: 启动开发服务器**

```bash
npm run dev
```

**Step 3: 测试搜索功能**

1. 访问 http://localhost:3000
2. 输入查询: "什么是 TypeScript?"
3. 点击搜索
4. 验证:
   - [ ] 加载状态正确显示
   - [ ] AI 答案生成并显示
   - [ ] 来源列表正确显示
   - [ ] 引用标记 [1][2] 正常工作
   - [ ] 无错误信息

**Step 4: 测试边界情况**

测试以下场景:
- [ ] 空查询(应该被阻止)
- [ ] 超长查询
- [ ] 无搜索结果的查询
- [ ] 网络错误处理

**Step 5: 检查数据库**

```bash
npx prisma studio
```

验证搜索记录是否正确保存。

**Step 6: 提交配置文件**

```bash
git add .env.example
git commit -m "docs: 添加环境变量示例

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 部署准备

### Task 11: 添加部署配置

**目标:** 准备 Vercel 部署

**Files:**
- Create: `vercel.json`
- Create: `.env.example`

**Step 1: 创建 Vercel 配置**

创建 `vercel.json`:

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

**Step 2: 创建环境变量示例**

创建 `.env.example`:

```env
# Database
DATABASE_URL=""

# OpenAI
OPENAI_API_KEY=""

# Tavily Search
TAVILY_API_KEY=""
```

**Step 3: 创建 README**

创建 `README.md`:

```markdown
# ZCF Search

AI 驱动的智能搜索引擎,基于 Scira.ai 设计。

## 功能

- ✅ 实时网络搜索
- ✅ AI 答案生成(带引用)
- ✅ 来源展示
- ✅ 搜索历史

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Vercel AI SDK
- Prisma
- OpenAI GPT-4
- Tavily Search API

## 本地开发

1. 安装依赖:
   \`bash
   npm install
   \`

2. 配置环境变量:
   \`bash
   cp .env.example .env
   \`

   编辑 \`.env\` 并填入你的 API 密钥。

3. 初始化数据库:
   \`bash
   npx prisma generate
   npx prisma db push
   \`

4. 启动开发服务器:
   \`bash
   npm run dev
   \`

5. 访问 http://localhost:3000

## 项目结构

\`\`
src/
├── app/              # Next.js App Router
├── components/       # React 组件
└── lib/             # 工具函数和服务
\`\`

## License

MIT
```

**Step 4: 提交**

```bash
git add vercel.json .env.example README.md
git commit -m "docs: 添加部署配置和文档

- 添加 Vercel 配置
- 创建环境变量示例
- 编写 README 文档

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 完成

### Task 12: 最终验证和合并

**目标:** 确保所有功能完成并准备合并

**Files:**
- None (最终检查)

**Step 1: 运行所有测试**

```bash
npm run build
```

确保构建成功。

**Step 2: 检查分支**

```bash
git status
git log --oneline
```

确认所有提交都在 `feature/basic-search` 分支。

**Step 3: 创建总结**

创建功能总结文档:

创建 `docs/basic-search-mvp-summary.md`:

```markdown
# 基础搜索 MVP 实施总结

## 已完成功能

### 核心功能
- ✅ 实时网络搜索(Tavily API)
- ✅ AI 答案生成(OpenAI GPT-4)
- ✅ 来源引用展示
- ✅ 搜索历史记录

### 技术实现
- ✅ Next.js 14 App Router
- ✅ TypeScript 类型安全
- ✅ Tailwind CSS + shadcn/ui UI
- ✅ Prisma ORM + PostgreSQL
- ✅ API 路由实现
- ✅ 错误处理

## API 端点

- \`POST /api/search\` - 执行搜索并生成答案

## 组件

- \`SearchInput\` - 搜索输入框
- \`AnswerDisplay\` - 答案展示
- \`SourcesList\` - 来源列表

## 数据库模型

- \`Search\` - 搜索记录

## 待优化项

- [ ] 添加流式响应
- [ ] 实现用户认证
- [ ] 添加图片和视频搜索
- [ ] 优化移动端体验
- [ ] 添加单元测试

## 下一步

Phase 2 将实现:
- OAuth 登录(Google/GitHub)
- 多轮对话
- 搜索历史管理
- 图片和视频展示
```

**Step 4: 最终提交**

```bash
git add docs/basic-search-mvp-summary.md
git commit -m "docs: 添加 MVP 实施总结

- 列出已完成功能
- 记录待优化项
- 规划下一步开发

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

**Step 5: 准备合并**

```bash
cd ../..
git checkout master
git merge feature/basic-search
```

---

## 总结

这个计划涵盖了从零开始构建 AI 搜索引擎 MVP 的所有步骤:

**12 个任务,约 50+ 个步骤**
- 项目初始化
- 数据库设置
- 核心服务实现
- UI 组件开发
- API 集成
- 测试验证
- 部署准备

**预计时间:** 4-6 小时

**技术难点:**
- API 集成和错误处理
- 流式响应(Phase 2)
- 数据库 schema 设计

**关键依赖:**
- OpenAI API Key
- Tavily API Key
- PostgreSQL 数据库

**下一步:**
完成 MVP 后,继续实施 Phase 2(增强功能)。
