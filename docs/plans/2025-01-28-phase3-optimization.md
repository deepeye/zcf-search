# Phase 3: 优化与增强实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 在 Phase 2 基础上优化用户体验、添加高级功能、提升性能和稳定性

**架构:** 基于现有架构，添加流式响应、实时通信、错误处理等增强功能

**技术栈:** Next.js 14, React 18, TypeScript, Vercel AI SDK (Streaming), WebSocket, React Query, Zod (验证)

---

## 优先级说明

- **P0 (关键):** 核心体验，必须实施
- **P1 (重要):** 显著提升，强烈建议
- **P2 (优化):** 锦上添花，可按需实施

---

## 第一部分：用户体验优化（P0）

### Task 1: 实现流式响应

**目标:** 使用流式响应大幅提升 AI 答案生成的用户体验

**优先级:** P0 (关键)

**技术方案:** 使用 Vercel AI SDK 的 `streamText` 实现流式生成

**Files:**
- Modify: `src/lib/ai.ts`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/AnswerDisplay.tsx`

**Step 1: 更新 AI 服务支持流式响应**

修改 `src/lib/ai.ts`:

```typescript
import { OpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAnswerStream(
  query: string,
  sources: Array<{ title: string; content: string; url: string }>
) {
  const prompt = buildPrompt(query, sources)

  const result = await streamText({
    model: openai('gpt-4'),
    prompt,
    temperature: 0.7,
    maxTokens: 2000,
  })

  return result.toDataStreamResponse()
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

// 保留非流式版本用于兼容
export async function generateAnswer(
  query: string,
  sources: Array<{ title: string; content: string; url: string }>
): Promise<string> {
  // ... 保持现有实现
}
```

**Step 2: 创建流式搜索 API**

修改 `src/app/api/search/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { searchWeb } from '@/lib/search'
import { generateAnswerStream } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: '查询内容不能为空' },
        { status: 400 }
      )
    }

    // 执行搜索
    const sources = await searchWeb(query)

    if (sources.length === 0) {
      return Response.json({
        answer: '未找到相关信息,请尝试其他关键词。',
        sources: [],
      })
    }

    // 返回流式响应
    return generateAnswerStream(query, sources)
  } catch (error) {
    console.error('Search error:', error)
    return Response.json(
      { error: '搜索失败,请稍后重试' },
      { status: 500 }
    )
  }
}
```

**Step 3: 创建流式答案组件**

修改 `src/components/AnswerDisplay.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card } from '@/components/ui/card'
import { useChat } from 'ai/react'

interface AnswerDisplayProps {
  answer?: string
  isLoading?: boolean
  query?: string
  onStreamComplete?: (answer: string) => void
}

export function AnswerDisplay({
  answer,
  isLoading = false,
  query,
  onStreamComplete,
}: AnswerDisplayProps) {
  const [streamedAnswer, setStreamedAnswer] = useState('')

  // 使用 useChat hook 处理流式响应
  const { messages, isLoading: isStreaming } = useChat({
    api: '/api/search',
    body: {
      query: query || '',
    },
    onFinish: (message) => {
      if (onStreamComplete) {
        onStreamComplete(message.content)
      }
    },
  })

  useEffect(() => {
    if (query && !answer) {
      // 触发搜索
    }
  }, [query])

  if (isLoading || isStreaming) {
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

  const displayAnswer = streamedAnswer || answer || ''

  if (!displayAnswer) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown>{displayAnswer}</ReactMarkdown>
      </div>
    </Card>
  )
}
```

**Step 4: 更新主页使用流式响应**

修改 `src/app/page.tsx`:

```typescript
// 更新搜索处理，移除旧的 fetch 调用
// useChat hook 会自动处理
```

**Step 5: 测试流式响应**

```bash
npm run dev
```

1. 访问 http://localhost:3000
2. 输入查询并观察答案逐字生成
3. 验证流式效果流畅无卡顿

**Step 6: 提交**

```bash
git add src/lib/ai.ts src/app/api/search/route.ts src/components/AnswerDisplay.tsx src/app/page.tsx
git commit -m "feat(phase3): 实现流式响应

- 使用 Vercel AI SDK streamText 实现流式生成
- 更新搜索 API 返回流式响应
- 创建流式答案展示组件
- 大幅提升用户体验

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 2: 添加加载骨架屏和过渡动画

**目标:** 优化加载状态，提升视觉体验

**优先级:** P0 (关键)

**Files:**
- Create: `src/components/ui/skeleton.tsx`
- Modify: `src/components/AnswerDisplay.tsx`
- Modify: `src/components/conversation/ConversationList.tsx`
- Modify: `src/components/history/HistoryList.tsx`

**Step 1: 添加 Skeleton 组件**

```bash
npx shadcn@latest add skeleton
```

**Step 2: 更新组件使用骨架屏**

为所有加载状态添加更友好的骨架屏。

**Step 3: 提交**

```bash
git add src/components/ui/skeleton.tsx
git commit -m "feat(phase3): 添加加载骨架屏

- 添加 Skeleton UI 组件
- 为列表和卡片添加骨架屏
- 优化加载状态展示

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 3: 优化移动端体验

**目标:** 确保应用在移动设备上完美运行

**优先级:** P0 (关键)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/SearchInput.tsx`
- Create: `src/components/MobileNav.tsx`

**Step 1: 创建移动端导航组件**

创建 `src/components/MobileNav.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Menu, X, MessageSquare, History, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  if (!session) return null

  return (
    <>
      {/* 菜单按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* 移动端侧边栏 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-64 bg-background p-6">
            <nav className="space-y-4">
              <Link
                href="/conversations"
                className="flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare className="h-5 w-5" />
                对话
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <History className="h-5 w-5" />
                历史
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
```

**Step 2: 更新响应式布局**

确保所有组件在小屏幕上正确显示。

**Step 3: 测试移动端**

1. 使用浏览器开发者工具测试移动端视图
2. 测试触摸交互
3. 验证布局响应

**Step 4: 提交**

```bash
git add src/components/MobileNav.tsx
git commit -m "feat(phase3): 优化移动端体验

- 添加移动端导航组件
- 优化响应式布局
- 改善触摸交互体验

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 4: 添加错误边界

**目标:** 捕获和处理错误，提升稳定性

**优先级:** P0 (关键)

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 创建错误边界组件**

创建 `src/components/ErrorBoundary.tsx`:

```typescript
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  出错了
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {this.state.error?.message || '应用遇到意外错误'}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  重新加载
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

**Step 2: 在布局中添加错误边界**

**Step 3: 提交**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "feat(phase3): 添加错误边界

- 创建 ErrorBoundary 组件
- 在根布局添加错误捕获
- 提供友好的错误提示

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 第二部分：功能增强（P1）

### Task 5: 实现导出对话功能

**目标:** 允许用户导出对话为 Markdown 或 PDF

**优先级:** P1 (重要)

**Files:**
- Create: `src/lib/export.ts`
- Create: `src/components/ExportButton.tsx`
- Modify: `src/app/conversations/page.tsx`

**Step 1: 创建导出工具函数**

创建 `src/lib/export.ts`:

```typescript
import { Message } from '@prisma/client'

export function exportToMarkdown(
  title: string,
  messages: Array<{ role: string; content: string }>
): string {
  let markdown = `# ${title}\n\n`
  markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '👤 用户' : '🤖 助手'
    markdown += `## ${role}\n\n${msg.content}\n\n---\n\n`
  })

  return markdown
}

export function downloadMarkdown(
  title: string,
  messages: Array<{ role: string; content: string }>
) {
  const markdown = exportToMarkdown(title, messages)
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

**Step 2: 创建导出按钮组件**

创建 `src/components/ExportButton.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { downloadMarkdown } from '@/lib/export'

interface ExportButtonProps {
  title: string
  messages: Array<{ role: string; content: string }>
}

export function ExportButton({ title, messages }: ExportButtonProps) {
  const handleExportMarkdown = () => {
    downloadMarkdown(title, messages)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportMarkdown}>
          <FileText className="h-4 w-4 mr-2" />
          导出为 Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Step 3: 集成到对话页面**

**Step 4: 提交**

```bash
git add src/lib/export.ts src/components/ExportButton.tsx
git commit -m "feat(phase3): 添加导出对话功能

- 实现导出为 Markdown 格式
- 创建导出按钮组件
- 支持下载对话记录

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 6: 实现高级搜索过滤

**目标:** 允许用户按日期、类型、来源过滤搜索结果

**优先级:** P1 (重要)

**Files:**
- Create: `src/components/SearchFilters.tsx`
- Modify: `src/app/history/page.tsx`
- Modify: `src/app/api/history/route.ts`

**Step 1: 创建过滤组件**

创建 `src/components/SearchFilters.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Filter } from 'lucide-react'

export type FilterType = 'all' | 'today' | 'week' | 'month'
export type SortType = 'date' | 'relevance'

interface SearchFiltersProps {
  onFilterChange: (filter: FilterType) => void
  onSortChange: (sort: SortType) => void
  filter: FilterType
  sort: SortType
}

export function SearchFilters({
  onFilterChange,
  onSortChange,
  filter,
  sort,
}: SearchFiltersProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="today">今天</SelectItem>
            <SelectItem value="week">本周</SelectItem>
            <SelectItem value="month">本月</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">按日期</SelectItem>
            <SelectItem value="relevance">按相关性</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

**Step 2: 更新 API 支持过滤**

修改 `src/app/api/history/route.ts`:

```typescript
// 添加过滤参数
const { searchParams } = new URL(request.url)
const filter = searchParams.get('filter') || 'all'
const sort = searchParams.get('sort') || 'date'

// 根据 filter 添加时间过滤
let whereClause: any = { userId: session.user.id }

if (filter === 'today') {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  whereClause.createdAt = { gte: today }
}
// ... 其他过滤条件
```

**Step 3: 提交**

```bash
git add src/components/SearchFilters.tsx
git commit -m "feat(phase3): 添加高级搜索过滤

- 实现按时间过滤（今天/本周/本月）
- 实现排序功能（日期/相关性）
- 创建过滤组件
- 更新 API 支持过滤参数

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 7: 实现收藏和书签功能

**目标:** 允许用户收藏搜索结果和对话

**优先级:** P1 (重要)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/app/api/favorites/route.ts`
- Create: `src/components/FavoriteButton.tsx`
- Create: `src/app/favorites/page.tsx`

**Step 1: 更新数据库模型**

在 `prisma/schema.prisma` 添加:

```prisma
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // 'search' | 'conversation'
  itemId    String   // search.id or conversation.id
  createdAt DateTime @default(now())

  @@unique([userId, type, itemId])
  @@index([userId])
}
```

**Step 2: 创建收藏 API**

**Step 3: 创建收藏组件**

**Step 4: 提交**

```bash
git add prisma/schema.prisma src/app/api/favorites/
git commit -m "feat(phase3): 添加收藏功能

- 添加 Favorite 数据模型
- 实现收藏 API
- 创建收藏按钮组件
- 创建收藏页面

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 第三部分：性能优化（P1）

### Task 8: 实现 React Query 优化数据获取

**目标:** 使用 React Query 替代 SWR，提供更好的缓存和状态管理

**优先级:** P1 (重要)

**Files:**
- Create: `src/lib/react-query.tsx`
- Modify: `src/components/providers.tsx`
- Modify: `src/components/conversation/ConversationList.tsx`
- Modify: `src/components/history/HistoryList.tsx`

**Step 1: 安装 React Query**

```bash
npm install @tanstack/react-query
```

**Step 2: 配置 React Query**

创建 `src/lib/react-query.tsx`:

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 分钟
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Step 3: 更新组件使用 useQuery**

**Step 4: 提交**

```bash
git add src/lib/react-query.tsx
git commit -m "feat(phase3): 集成 React Query

- 添加 React Query 配置
- 替换 SWR 为 useQuery
- 优化数据缓存策略

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 9: 实现虚拟滚动

**目标:** 对长列表使用虚拟滚动优化性能

**优先级:** P1 (重要)

**Files:**
- Modify: `src/components/conversation/ConversationList.tsx`
- Modify: `src/components/history/HistoryList.tsx`

**Step 1: 安装虚拟滚动库**

```bash
npm install @tanstack/react-virtual
```

**Step 2: 实现虚拟滚动列表**

**Step 3: 提交**

```bash
git commit -m "feat(phase3): 添加虚拟滚动

- 使用 @tanstack/react-virtual
- 优化长列表性能
- 减少渲染开销

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 第四部分：新功能（P2）

### Task 10: 添加深色模式

**目标:** 实现深色模式切换

**优先级:** P2 (优化)

**Files:**
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: 安装 next-themes**

```bash
npm install next-themes
```

**Step 2: 配置主题提供者**

**Step 3: 创建主题切换组件**

**Step 4: 提交**

```bash
git commit -m "feat(phase3): 添加深色模式

- 集成 next-themes
- 创建主题切换组件
- 优化深色模式样式

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 11: 实现数据统计面板

**目标:** 为用户展示搜索和使用统计

**优先级:** P2 (优化)

**Files:**
- Create: `src/app/api/stats/route.ts`
- Create: `src/app/stats/page.tsx`
- Create: `src/components/StatsCard.tsx`

**Step 1: 创建统计 API**

**Step 2: 创建统计页面**

**Step 3: 提交**

```bash
git commit -m "feat(phase3): 添加数据统计面板

- 实现搜索次数统计
- 展示使用趋势
- 创建统计卡片组件

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 12: 实现分享对话功能

**目标:** 允许用户生成对话分享链接

**优先级:** P2 (优化)

**Files:**
- Create: `src/lib/share.ts`
- Create: `src/components/ShareButton.tsx`
- Create: `src/app/share/[id]/page.tsx`

**Step 1: 创建分享功能**

**Step 2: 创建公开分享页面**

**Step 3: 提交**

```bash
git commit -m "feat(phase3): 添加分享对话功能

- 实现对话分享链接生成
- 创建公开查看页面
- 添加复制链接功能

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 第五部分：测试和部署（P0-P1）

### Task 13: 添加单元测试

**目标:** 为核心组件和函数添加测试

**优先级:** P1 (重要)

**Files:**
- Create: `src/lib/__tests__/ai.test.ts`
- Create: `src/lib/__tests__/search.test.ts`
- Create: `src/components/__tests__/SearchInput.test.tsx`

**Step 1: 安装测试依赖**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Step 2: 配置 Vitest**

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 3: 编写测试用例**

**Step 4: 更新 package.json**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Step 5: 提交**

```bash
git add vitest.config.ts src/test/
git commit -m "test(phase3): 添加单元测试

- 配置 Vitest 测试环境
- 为核心函数添加测试
- 为组件添加测试
- 目标覆盖率 80%+

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 14: 配置 Vercel 部署

**目标:** 部署应用到 Vercel 生产环境

**优先级:** P0 (关键)

**Files:**
- Modify: `vercel.json`
- Create: `.env.production`

**Step 1: 更新 Vercel 配置**

修改 `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXTAUTH_URL": {
      "description": "应用 URL"
    },
    "NEXTAUTH_SECRET": {
      "description": "NextAuth 密钥"
    },
    "DATABASE_URL": {
      "description": "数据库连接字符串"
    },
    "OPENAI_API_KEY": {
      "description": "OpenAI API 密钥"
    },
    "TAVILY_API_KEY": {
      "description": "Tavily API 密钥"
    },
    "GOOGLE_CLIENT_ID": {
      "description": "Google OAuth 客户端 ID"
    },
    "GOOGLE_CLIENT_SECRET": {
      "description": "Google OAuth 客户端密钥"
    },
    "GITHUB_ID": {
      "description": "GitHub OAuth 客户端 ID"
    },
    "GITHUB_SECRET": {
      "description": "GitHub OAuth 客户端密钥"
    }
  }
}
```

**Step 2: 连接 Vercel**

```bash
npx vercel link
```

**Step 3: 部署到 Vercel**

```bash
npx vercel --prod
```

**Step 4: 配置自定义域名（可选）

**Step 5: 提交配置**

```bash
git add vercel.json
git commit -m "deploy(phase3): 配置 Vercel 生产部署

- 更新 Vercel 配置
- 添加环境变量说明
- 配置函数超时和区域

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 15: 设置监控和错误追踪

**目标:** 集成 Sentry 进行错误监控

**优先级:** P1 (重要)

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`

**Step 1: 安装 Sentry**

```bash
npm install @sentry/nextjs
```

**Step 2: 配置 Sentry**

**Step 3: 提交**

```bash
git commit -m "monitor(phase3): 集成 Sentry 错误追踪

- 配置客户端和服务端 Sentry
- 添加错误监控
- 添加性能监控

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 总结

### 任务概览

**共 15 个任务，分为 5 个部分：**

1. **用户体验优化（P0）** - 4 个任务
   - 流式响应
   - 加载骨架屏
   - 移动端优化
   - 错误边界

2. **功能增强（P1）** - 3 个任务
   - 导出对话
   - 高级过滤
   - 收藏功能

3. **性能优化（P1）** - 2 个任务
   - React Query
   - 虚拟滚动

4. **新功能（P2）** - 3 个任务
   - 深色模式
   - 数据统计
   - 分享功能

5. **测试和部署（P0-P1）** - 3 个任务
   - 单元测试
   - Vercel 部署
   - 错误监控

### 预计时间

- **P0 任务（关键）：** 2-3 天
- **P1 任务（重要）：** 3-4 天
- **P2 任务（优化）：** 2-3 天

**总计：** 7-10 天（取决于实施范围）

### 技术难点

1. 流式响应实现
2. 虚拟滚动集成
3. 测试覆盖率
4. 生产环境配置

### 完成标准

- [ ] 所有 P0 任务完成
- [ ] 核心功能测试通过
- [ ] 成功部署到生产环境
- [ ] 测试覆盖率达到 80%+
- [ ] 性能指标达标（LCP < 2.5s）

### 下一步

完成 Phase 3 后，应用将具备：
- ✅ 流畅的用户体验
- ✅ 完善的功能集
- ✅ 良好的性能表现
- ✅ 可靠的错误处理
- ✅ 生产级部署
