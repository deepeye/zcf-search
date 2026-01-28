# ZCF Search

AI 驱动的智能搜索引擎,基于 Scira.ai 设计。

## 功能

- ✅ 实时网络搜索
- ✅ AI 答案生成(带引用)
- ✅ 来源展示
- ✅ 搜索历史

## 技术栈

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Vercel AI SDK
- Prisma
- OpenAI GPT-4
- Tavily Search API

## 本地开发

1. 安装依赖:
   ```bash
   npm install
   ```

2. 配置环境变量:
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 并填入你的 API 密钥。

3. 初始化数据库:
   ```bash
   npx prisma generate
   ```

4. 启动开发服务器:
   ```bash
   npm run dev
   ```

5. 访问 http://localhost:3000

## 项目结构

```
src/
├── app/              # Next.js App Router
├── components/       # React 组件
└── lib/             # 工具函数和服务
```

## 环境变量

详见 `.env.example`。

## License

MIT
