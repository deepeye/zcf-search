# 本地开发指南

## 环境变量配置

复制 `.env.example` 为 `.env` 并填入你的 API 密钥:

```bash
cp .env.example .env
```

### 必需的 API 密钥

1. **OpenAI API Key** - 用于 AI 答案生成
   - 获取地址: https://platform.openai.com/api-keys

2. **Tavily API Key** - 用于网络搜索
   - 获取地址: https://tavily.com

### 数据库配置 (可选)

如果启用数据库功能,配置 `DATABASE_URL`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/zcf_search"
```

## 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 功能测试清单

- [ ] 搜索功能正常工作
- [ ] AI 答案正确显示
- [ ] 来源列表正确显示
- [ ] 错误处理正常
