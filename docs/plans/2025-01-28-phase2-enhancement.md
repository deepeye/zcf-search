# Phase 2: 增强功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 在 MVP 基础上添加用户认证、多轮对话、搜索历史管理和多媒体搜索功能

**架构:** 扩展现有架构，添加 NextAuth.js 用于认证，优化数据库模型支持对话和用户关联

**技术栈:** Next.js 14, NextAuth.js v5 (Beta), Prisma, Tavily API, OpenAI API, React Context

---

## 前置准备

### Task 0: 安装额外依赖

**目标:** 安装 Phase 2 所需的新依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 NextAuth.js v5 (Beta)**

```bash
npm install next-auth@beta
```

**Step 2: 安装 OAuth 提供商依赖**

```bash
npm install @auth/core
```

**Step 3: 安装对话管理相关依赖**

```bash
npm install swr
npm install @tanstack/react-query
```

**Step 4: 验证安装**

```bash
npm run build
```

确保构建成功，无依赖冲突。

**Step 5: 提交**

```bash
git add package.json package-lock.json
git commit -m "feat(phase2): 安装 Phase 2 依赖

- 添加 NextAuth.js v5
- 添加 OAuth 支持
- 添加 SWR 用于数据获取

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 用户认证系统

### Task 1: 更新数据库模型

**目标:** 添加用户和会话相关的数据库模型

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: 添加用户模型**

在 `prisma/schema.prisma` 中添加：

```prisma
/// User 表示应用用户
model User {
  /// 唯一标识符
  id            String    @id @default(cuid())
  /// 用户名称
  name          String?
  /// 用户邮箱
  email         String?   @unique
  /// 用户头像
  image         String?
  /// OAuth 提供商 (google, github)
  provider      String?
  /// OAuth 账户 ID
  providerAccountId String?
  /// 创建时间
  createdAt     DateTime  @default(now())
  /// 最后登录时间
  lastLoginAt   DateTime  @default(now())
  /// 用户的搜索记录
  searches      Search[]
  /// 用户的对话
  conversations Conversation[]
  /// 账户关联
  accounts      Account[]
  /// 会话关联
  sessions      Session[]

  @@index([email])
}

/// Account 用于 OAuth 账户关联
model Account {
  /// 唯一标识符
  id                String  @id @default(cuid())
  /// 关联用户
  userId            String
  /// 账户类型 (oauth)
  type              String
  /// OAuth 提供商
  provider          String
  /// 提供商账户 ID
  providerAccountId String
  /// 刷新令牌
  refresh_token     String? @db.Text
  /// 访问令牌
  access_token      String? @db.Text
  /// 令牌过期时间
  expires_at        Int?
  /// 令牌类型
  token_type        String?
  /// 作用域
  scope             String?
  /// ID 令牌
  id_token          String? @db.Text
  /// 会话状态
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

/// Session 用于用户会话管理
model Session {
  /// 唯一标识符
  id           String   @id @default(cuid())
  /// 会话令牌
  sessionToken String   @unique
  /// 关联用户
  userId       String
  /// 过期时间
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

/// VerificationToken 用于邮箱验证
model VerificationToken {
  /// 标识符
  identifier String
  /// 令牌
  token      String   @unique
  /// 过期时间
  expires    DateTime

  @@unique([identifier, token])
}
```

**Step 2: 更新 Search 模型**

修改现有的 Search 模型，添加用户关联：

```prisma
model Search {
  id        String   @id @default(cuid())
  query     String
  answer    String   @db.Text
  sources   Json     @default("[]")
  createdAt DateTime @default(now())

  /// 关联用户 (可选，支持匿名搜索)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
}
```

**Step 3: 添加 Conversation 模型**

```prisma
/// Conversation 表示多轮对话
model Conversation {
  /// 唯一标识符
  id        String   @id @default(cuid())
  /// 对话标题
  title     String
  /// 创建时间
  createdAt DateTime @default(now())
  /// 更新时间
  updatedAt DateTime @updatedAt
  /// 关联用户
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  /// 对话消息
  messages  Message[]

  @@index([userId])
}

/// Message 表示对话中的单条消息
model Message {
  /// 唯一标识符
  id             String   @id @default(cuid())
  /// 关联对话
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  /// 角色类型
  role           String // 'user' | 'assistant' | 'system'
  /// 消息内容
  content        String   @db.Text
  /// AI 使用的来源 (仅 assistant 消息)
  sources        Json?    @default("[]")
  /// 创建时间
  createdAt      DateTime @default(now())

  @@index([conversationId])
}
```

**Step 4: 生成 Prisma Client**

```bash
npx prisma generate
```

**Step 5: 推送 schema 到数据库**

```bash
npx prisma db push
```

**Step 6: 提交**

```bash
git add prisma/schema.prisma
git commit -m "feat(phase2): 添加用户认证和对话数据模型

- 添加 User, Account, Session 模型
- 添加 Conversation, Message 模型支持多轮对话
- 更新 Search 模型添加用户关联
- 添加数据库索引优化查询

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 2: 配置 NextAuth.js

**目标:** 设置 NextAuth.js 认证配置

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

**Step 1: 创建认证配置**

创建 `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHub({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  pages: {
    signIn: "/auth/signin",
  },
})
```

**Step 2: 创建 API 路由**

创建 `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
export { handlers as GET, handlers as POST } from "@/lib/auth"
```

**Step 3: 更新环境变量**

在 `.env` 中添加：

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth
GITHUB_ID=""
GITHUB_SECRET=""
```

**Step 4: 提交**

```bash
git add src/lib/auth.ts src/app/api/auth/
git commit -m "feat(phase2): 添加 NextAuth.js 配置

- 配置 Google 和 GitHub OAuth
- 添加认证 API 路由
- 更新环境变量模板

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 3: 创建认证 UI 组件

**目标:** 创建登录/登出界面和组件

**Files:**
- Create: `src/components/auth/UserButton.tsx`
- Create: `src/components/auth/SignInButton.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: 创建用户按钮组件**

创建 `src/components/auth/UserButton.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut } from 'lucide-react'

export function UserButton() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Step 2: 创建登录按钮组件**

创建 `src/components/auth/SignInButton.tsx`:

```typescript
'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function SignInButton() {
  const handleSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/' })
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleSignIn('google')}
        variant="outline"
        className="flex-1"
      >
        使用 Google 登录
      </Button>
      <Button
        onClick={() => handleSignIn('github')}
        variant="outline"
        className="flex-1"
      >
        使用 GitHub 登录
      </Button>
    </div>
  )
}
```

**Step 3: 添加 DropdownMenu 组件**

```bash
npx shadcn-ui@latest add dropdown-menu
```

**Step 4: 更新布局**

修改 `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZCF Search - AI 智能搜索",
  description: "AI 驱动的智能搜索引擎",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Step 5: 提交**

```bash
git add src/components/auth/ src/components/Header.tsx src/app/layout.tsx
git commit -m "feat(phase2): 添加认证 UI 组件

- 创建 UserButton 组件显示用户信息
- 创建 SignInButton 组件支持 OAuth 登录
- 添加 Header 组件集成认证按钮
- 更新布局添加 Header

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 多轮对话功能

### Task 4: 创建对话管理 API

**目标:** 实现对话的创建、查询和消息添加

**Files:**
- Create: `src/app/api/conversations/route.ts`
- Create: `src/app/api/conversations/[id]/route.ts`
- Create: `src/app/api/conversations/[id]/messages/route.ts`

**Step 1: 创建对话列表和创建 API**

创建 `src/app/api/conversations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/conversations - 获取用户的所有对话
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const conversations = await db.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: '获取对话列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/conversations - 创建新对话
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { title, query, answer, sources } = await request.json()

    const conversation = await db.conversation.create({
      data: {
        title: title || query.substring(0, 50),
        userId: session.user.id,
        messages: {
          create: [
            {
              role: 'user',
              content: query,
            },
            {
              role: 'assistant',
              content: answer,
              sources: sources || [],
            },
          ],
        },
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: '创建对话失败' },
      { status: 500 }
    )
  }
}
```

**Step 2: 创建单个对话查询 API**

创建 `src/app/api/conversations/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/conversations/[id] - 获取对话详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: '获取对话失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/conversations/[id] - 删除对话
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await db.conversation.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: '删除对话失败' },
      { status: 500 }
    )
  }
}
```

**Step 3: 创建消息添加 API**

创建 `src/app/api/conversations/[id]/messages/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/conversations/[id]/messages - 添加消息到对话
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { role, content, sources } = await request.json()

    // 验证对话所有权
    const conversation = await db.conversation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 })
    }

    // 添加消息
    const message = await db.message.create({
      data: {
        conversationId: params.id,
        role,
        content,
        sources: sources || [],
      },
    })

    // 更新对话时间
    await db.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Add message error:', error)
    return NextResponse.json(
      { error: '添加消息失败' },
      { status: 500 }
    )
  }
}
```

**Step 4: 提交**

```bash
git add src/app/api/conversations/
git commit -m "feat(phase2): 添加对话管理 API

- 实现对话列表查询
- 实现对话创建和删除
- 实现消息添加到对话
- 添加权限验证

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 5: 创建对话 UI 组件

**目标:** 创建对话界面和消息展示组件

**Files:**
- Create: `src/components/conversation/ConversationList.tsx`
- Create: `src/components/conversation/ConversationView.tsx`
- Create: `src/components/conversation/MessageList.tsx`
- Create: `src/app/conversations/page.tsx`

**Step 1: 创建对话列表组件**

创建 `src/components/conversation/ConversationList.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  title: string
  updatedAt: string
  messages: Array<{ role: string; content: string }>
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void
  selectedId?: string
}

export function ConversationList({
  onSelectConversation,
  selectedId,
}: ConversationListProps) {
  const { data: conversations, error } = useSWR<Conversation[]>(
    '/api/conversations'
  )

  if (error) {
    return <div className="p-4 text-destructive">加载对话列表失败</div>
  }

  if (!conversations) {
    return <div className="p-4">加载中...</div>
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>还没有对话记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <Card
          key={conv.id}
          className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
            selectedId === conv.id ? 'bg-accent' : ''
          }`}
          onClick={() => onSelectConversation(conv.id)}
        >
          <h3 className="font-medium text-sm truncate">{conv.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(conv.updatedAt).toLocaleDateString('zh-CN')}
          </p>
        </Card>
      ))}
    </div>
  )
}
```

**Step 2: 创建消息列表组件**

创建 `src/components/conversation/MessageList.tsx`:

```typescript
'use client'

import { Card } from '@/components/ui/card'
import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: string
  content: string
  sources?: any
}

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
            </div>
          )}
          <Card
            className={`p-4 max-w-[80%] ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </Card>
          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

**Step 3: 创建对话视图组件**

创建 `src/components/conversation/ConversationView.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { MessageList } from '@/components/MessageList'
import { SourcesList } from '@/components/SourcesList'
import { searchWeb } from '@/lib/search'
import { generateAnswer } from '@/lib/ai'
import { auth } from '@/lib/auth'

interface Message {
  id: string
  role: string
  content: string
  sources?: any
}

interface ConversationViewProps {
  conversationId: string
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 加载对话消息
    fetch(`/api/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || [])
      })
  }, [conversationId])

  const handleSearch = async (query: string) => {
    setIsLoading(true)

    try {
      // 添加用户消息
      const userMessage = { role: 'user', content: query }
      setMessages((prev) => [...prev, userMessage])

      // 执行搜索
      const searchResults = await searchWeb(query)
      setSources(searchResults)

      // 生成答案
      const answer = await generateAnswer(query, searchResults)

      // 添加助手消息
      const assistantMessage = {
        role: 'assistant',
        content: answer,
        sources: searchResults,
      }
      setMessages((prev) => [...prev, assistantMessage])

      // 保存到后端
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: query,
        }),
      })

      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: answer,
          sources: searchResults,
        }),
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MessageList messages={messages} />
        </div>
        <div>
          {sources.length > 0 && <SourcesList sources={sources} />}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
        <SearchInput onSearch={handleSearch} isLoading={isLoading} />
      </div>
    </div>
  )
}
```

**Step 4: 创建对话页面**

创建 `src/app/conversations/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/conversation/ConversationList'
import { ConversationView } from '@/components/conversation/ConversationView'
import { useSession } from 'next-auth/react'

export default function ConversationsPage() {
  const { data: session } = useSession()
  const [selectedConversation, setSelectedConversation] = useState<string>()

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>请先登录</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 侧边栏 - 对话列表 */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">对话历史</h2>
          <ConversationList
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation}
          />
        </div>

        {/* 主内容 - 对话视图 */}
        <div className="lg:col-span-3">
          {selectedConversation ? (
            <ConversationView conversationId={selectedConversation} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              请选择一个对话开始
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 5: 提交**

```bash
git add src/components/conversation/ src/app/conversations/
git commit -m "feat(phase2): 添加多轮对话 UI

- 创建对话列表组件
- 创建消息展示组件
- 实现对话视图和消息输入
- 添加对话页面

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 搜索历史管理

### Task 6: 创建搜索历史 API

**目标:** 实现搜索历史的查询和管理

**Files:**
- Create: `src/app/api/history/route.ts`
- Create: `src/app/api/history/[id]/route.ts`

**Step 1: 创建搜索历史 API**

创建 `src/app/api/history/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/history - 获取用户的搜索历史
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const searches = await db.search.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.search.count({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      searches,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json(
      { error: '获取搜索历史失败' },
      { status: 500 }
    )
  }
}
```

**Step 2: 创建删除历史 API**

创建 `src/app/api/history/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE /api/history/[id] - 删除单条搜索历史
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await db.search.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete history error:', error)
    return NextResponse.json(
      { error: '删除历史记录失败' },
      { status: 500 }
    )
  }
}
```

**Step 3: 提交**

```bash
git add src/app/api/history/
git commit -m "feat(phase2): 添加搜索历史 API

- 实现搜索历史查询(支持分页)
- 实现单条历史删除
- 添加权限验证

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 7: 创建搜索历史 UI

**目标:** 创建搜索历史展示和管理界面

**Files:**
- Create: `src/components/history/HistoryList.tsx`
- Create: `src/app/history/page.tsx`

**Step 1: 创建历史列表组件**

创建 `src/components/history/HistoryList.tsx`:

```typescript
'use client'

import useSWR from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Clock } from 'lucide-react'

interface Search {
  id: string
  query: string
  answer: string
  createdAt: string
}

interface HistoryListProps {
  onSelectSearch?: (search: Search) => void
}

export function HistoryList({ onSelectSearch }: HistoryListProps) {
  const { data, error, mutate } = useSWR('/api/history?limit=20')

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条搜索记录吗？')) return

    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (error) {
    return <div className="p-4 text-destructive">加载失败</div>
  }

  if (!data) {
    return <div className="p-4">加载中...</div>
  }

  const { searches } = data

  if (searches.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>还没有搜索历史</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {searches.map((search: Search) => (
        <Card
          key={search.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectSearch?.(search)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{search.query}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(search.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(search.id)
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

**Step 2: 创建历史页面**

创建 `src/app/history/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { HistoryList } from '@/components/history/HistoryList'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { SourcesList } from '@/components/SourcesList'
import { useSession } from 'next-auth/react'

interface Search {
  id: string
  query: string
  answer: string
  sources: any
  createdAt: string
}

export default function HistoryPage() {
  const { data: session } = useSession()
  const [selectedSearch, setSelectedSearch] = useState<Search | null>(null)

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>请先登录</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">搜索历史</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 历史列表 */}
        <div className="lg:col-span-1">
          <HistoryList onSelectSearch={setSelectedSearch} />
        </div>

        {/* 详情视图 */}
        <div className="lg:col-span-2">
          {selectedSearch ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {selectedSearch.query}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedSearch.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <AnswerDisplay answer={selectedSearch.answer} />
              {selectedSearch.sources && (
                <SourcesList sources={selectedSearch.sources} />
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              选择一条搜索记录查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: 提交**

```bash
git add src/components/history/ src/app/history/
git commit -m "feat(phase2): 添加搜索历史功能

- 创建历史列表组件
- 实现历史记录查看
- 支持删除单条记录
- 添加历史页面

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 图片和视频搜索

### Task 8: 扩展搜索服务

**目标:** 添加图片和视频搜索功能

**Files:**
- Modify: `src/lib/search.ts`
- Modify: `src/lib/types.ts`
- Create: `src/components/media/MediaGallery.tsx`
- Create: `src/components/media/ImageGrid.tsx`
- Create: `src/components/media/VideoList.tsx`

**Step 1: 更新类型定义**

修改 `src/lib/types.ts`，添加：

```typescript
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

**Step 2: 扩展搜索服务**

修改 `src/lib/search.ts`，添加图片和视频搜索：

```typescript
export async function searchImages(query: string): Promise<MediaImage[]> {
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
      max_results: 5,
      include_images: true,
      include_answer: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Image search failed: ${response.statusText}`)
  }

  const data = await response.json()

  return (data.images || []).map((img: any) => ({
    url: img.url,
    title: img.description || 'Image',
    source: img.url,
  }))
}

export async function searchVideos(
  query: string
): Promise<MediaVideo[]> {
  // Tavily 不直接支持视频搜索，这里使用示例数据
  // 实际项目中可以集成 YouTube API 或其他视频搜索 API
  return []
}
```

**Step 3: 创建图片网格组件**

创建 `src/components/media/ImageGrid.tsx`:

```typescript
'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

interface MediaImage {
  url: string
  title: string
  source: string
}

interface ImageGridProps {
  images: MediaImage[]
}

export function ImageGrid({ images }: ImageGridProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        相关图片 ({images.length})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((image, index) => (
          <a
            key={index}
            href={image.source}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                <Image
                  src={image.url}
                  alt={image.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end">
                  <div className="p-2 bg-black/60 text-white text-xs w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{image.title}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: 创建媒体画廊组件**

创建 `src/components/media/MediaGallery.tsx`:

```typescript
'use client'

import { ImageGrid } from '@/components/media/ImageGrid'
import { VideoList } from '@/components/media/VideoList'

interface MediaGalleryProps {
  images?: Array<{ url: string; title: string; source: string }>
  videos?: Array<{
    url: string
    title: string
    description: string
    thumbnail: string
    source: string
  }>
}

export function MediaGallery({ images = [], videos = [] }: MediaGalleryProps) {
  if (images.length === 0 && videos.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <ImageGrid images={images} />
      {videos.length > 0 && <VideoList videos={videos} />}
    </div>
  )
}
```

**Step 5: 创建视频列表组件**

创建 `src/components/media/VideoList.tsx`:

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Play } from 'lucide-react'

interface MediaVideo {
  url: string
  title: string
  description: string
  thumbnail: string
  source: string
}

interface VideoListProps {
  videos: MediaVideo[]
}

export function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        相关视频 ({videos.length})
      </h3>
      <div className="space-y-3">
        {videos.map((video, index) => (
          <a
            key={index}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 relative w-32 h-20 bg-muted rounded">
                    <Play className="absolute inset-0 m-auto h-8 w-8 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      {video.title}
                      <ExternalLink className="h-3 w-3" />
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
```

**Step 6: 提交**

```bash
git add src/lib/search.ts src/lib/types.ts src/components/media/
git commit -m "feat(phase2): 添加图片和视频搜索

- 扩展搜索服务支持图片搜索
- 添加图片网格展示组件
- 添加视频列表组件
- 创建媒体画廊组件

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

### Task 9: 集成媒体搜索到主页

**目标:** 在主页添加媒体搜索选项

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/SearchInput.tsx`
- Create: `src/components/SearchOptions.tsx`

**Step 1: 创建搜索选项组件**

创建 `src/components/SearchOptions.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Search, Image, Video } from 'lucide-react'

type SearchType = 'all' | 'images' | 'videos'

interface SearchOptionsProps {
  selected: SearchType
  onChange: (type: SearchType) => void
}

export function SearchOptions({
  selected,
  onChange,
}: SearchOptionsProps) {
  const options = [
    { value: 'all' as const, label: '全部', icon: Search },
    { value: 'images' as const, label: '图片', icon: Image },
    { value: 'videos' as const, label: '视频', icon: Video },
  ]

  return (
    <div className="flex gap-2 mb-4">
      {options.map((option) => {
        const Icon = option.icon
        return (
          <Button
            key={option.value}
            variant={selected === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(option.value)}
          >
            <Icon className="h-4 w-4 mr-1" />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
```

**Step 2: 更新主页**

修改 `src/app/page.tsx`，集成媒体搜索：

```typescript
'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/SearchInput'
import { AnswerDisplay } from '@/components/AnswerDisplay'
import { SourcesList } from '@/components/SourcesList'
import { MediaGallery } from '@/components/media/MediaGallery'
import { SearchOptions } from '@/components/SearchOptions'
import { searchWeb, searchImages, searchVideos } from '@/lib/search'
import { generateAnswer } from '@/lib/ai'

type SearchType = 'all' | 'images' | 'videos'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState<SearchType>('all')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      if (searchType === 'images') {
        const images = await searchImages(query)
        setResult({ images })
      } else if (searchType === 'videos') {
        const videos = await searchVideos(query)
        setResult({ videos })
      } else {
        const sources = await searchWeb(query)
        const answer = await generateAnswer(query, sources)
        setResult({ answer, sources })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">ZCF Search</h1>
          <p className="text-muted-foreground">
            AI 驱动的智能搜索引擎
          </p>
        </div>

        <div className="mb-8">
          <SearchOptions selected={searchType} onChange={setSearchType} />
          <SearchInput
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="搜索任何内容..."
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {result.answer && (
                <AnswerDisplay answer={result.answer} />
              )}
              {result.images && (
                <MediaGallery images={result.images} />
              )}
              {result.videos && (
                <MediaGallery videos={result.videos} />
              )}
            </div>
            {result.sources && (
              <div>
                <SourcesList sources={result.sources} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
```

**Step 3: 提交**

```bash
git add src/app/page.tsx src/components/SearchOptions.tsx
git commit -m "feat(phase2): 集成媒体搜索到主页

- 添加搜索类型选项(全部/图片/视频)
- 更新主页支持媒体搜索
- 优化搜索结果展示

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 测试与验证

### Task 10: 端到端测试

**目标:** 测试所有 Phase 2 功能

**Files:**
- None (运行测试)

**Step 1: 配置 OAuth 凭证**

在 `.env` 中配置真实的 OAuth 凭证：

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

**Step 2: 启动开发服务器**

```bash
npm run dev
```

**Step 3: 测试用户认证**

1. 访问 http://localhost:3000
2. 点击右上角登录按钮
3. 测试 Google 登录
4. 测试 GitHub 登录
5. 验证用户信息正确显示
6. 测试登出功能

**Step 4: 测试多轮对话**

1. 创建新对话
2. 发送多条消息
3. 验证消息正确保存和显示
4. 测试对话列表切换
5. 测试对话删除

**Step 5: 测试搜索历史**

1. 执行多次搜索
2. 访问 /history 页面
3. 验证历史记录显示
4. 测试删除单条记录

**Step 6: 测试媒体搜索**

1. 切换到图片搜索
2. 搜索图片并验证展示
3. 切换到视频搜索
4. 验证视频列表显示

**Step 7: 提交**

```bash
git add .env.example
git commit -m "docs(phase2): 更新环境变量示例

- 添加 OAuth 凭证配置
- 完成 Phase 2 功能开发

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

---

## 完成

### Task 11: Phase 2 总结和准备部署

**目标:** 总结 Phase 2 功能并准备部署

**Files:**
- Create: `docs/phase2-summary.md`

**Step 1: 创建 Phase 2 总结**

创建 `docs/phase2-summary.md`:

```markdown
# Phase 2: 增强功能实施总结

## 已完成功能

### 用户认证系统
- ✅ NextAuth.js v5 集成
- ✅ Google OAuth 登录
- ✅ GitHub OAuth 登录
- ✅ 用户会话管理
- ✅ 数据库用户模型

### 多轮对话
- ✅ 对话创建和管理
- ✅ 消息添加和展示
- ✅ 对话历史查询
- ✅ 对话删除功能
- ✅ 实时消息更新

### 搜索历史
- ✅ 搜索历史记录
- ✅ 历史列表展示
- ✅ 历史详情查看
- ✅ 单条记录删除
- ✅ 分页支持

### 媒体搜索
- ✅ 图片搜索
- ✅ 图片网格展示
- ✅ 视频搜索框架
- ✅ 搜索类型切换

## 技术实现

### 新增 API 端点
- `POST /api/auth/[...nextauth]` - NextAuth 认证
- `GET /api/conversations` - 获取对话列表
- `POST /api/conversations` - 创建对话
- `GET /api/conversations/[id]` - 获取对话详情
- `DELETE /api/conversations/[id]` - 删除对话
- `POST /api/conversations/[id]/messages` - 添加消息
- `GET /api/history` - 获取搜索历史
- `DELETE /api/history/[id]` - 删除历史记录

### 新增组件
- `UserButton` - 用户头像和菜单
- `SignInButton` - OAuth 登录按钮
- `ConversationList` - 对话列表
- `ConversationView` - 对话视图
- `MessageList` - 消息列表
- `HistoryList` - 历史列表
- `MediaGallery` - 媒体画廊
- `ImageGrid` - 图片网格
- `VideoList` - 视频列表
- `SearchOptions` - 搜索类型选择

### 数据库模型
- `User` - 用户模型
- `Account` - OAuth 账户
- `Session` - 会话管理
- `Conversation` - 对话模型
- `Message` - 消息模型
- `VerificationToken` - 验证令牌

## 待优化项
- [ ] 添加流式响应
- [ ] 实现 WebSocket 实时更新
- [ ] 添加导出对话功能
- [ ] 优化移动端体验
- [ ] 添加单元测试
- [ ] 实现视频搜索 API 集成

## 下一步
Phase 3 可以考虑：
- 高级搜索过滤
- 收藏和书签功能
- 分享对话功能
- 数据分析面板
- 多语言支持
```

**Step 2: 最终提交**

```bash
git add docs/phase2-summary.md
git commit -m "docs(phase2): 添加 Phase 2 实施总结

- 列出已完成功能
- 记录新增 API 和组件
- 规划下一步开发

Co-Authored-By: Claude (glm-4.7) <noreply@anthropic.com>"
```

**Step 3: 运行构建测试**

```bash
npm run build
```

确保构建成功无错误。

---

## 总结

这个计划涵盖了 Phase 2 增强功能的所有步骤：

**11 个任务,约 60+ 个步骤**
- 用户认证系统 (3 tasks)
- 多轮对话功能 (2 tasks)
- 搜索历史管理 (2 tasks)
- 图片和视频搜索 (2 tasks)
- 集成和测试 (2 tasks)

**预计时间:** 6-8 小时

**技术难点:**
- NextAuth.js v5 配置
- 对话状态管理
- 媒体搜索 API 集成

**关键依赖:**
- Google OAuth 凭证
- GitHub OAuth 凭证
- Tavily API 图片搜索

**完成标准:**
- 所有功能测试通过
- 构建成功无错误
- 用户可以完成完整流程
