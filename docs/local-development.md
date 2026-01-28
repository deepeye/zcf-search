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

### 可选配置

**使用兼容 OpenAI 协议的其他服务**

如果你使用其他兼容 OpenAI API 的服务（如 Azure OpenAI、Anthropic Claude、本地部署的模型等），可以配置 `OPENAI_BASE_URL`:

```bash
# 示例: 使用 Azure OpenAI
OPENAI_BASE_URL="https://your-resource.openai.azure.com/openai/deployments/your-deployment"

# 示例: 使用本地模型 (如 Ollama)
OPENAI_BASE_URL="http://localhost:11434/v1"

# 示例: 使用其他兼容服务
OPENAI_BASE_URL="https://api.deepseek.com/v1"
```

**注意**:
- 如果不设置 `OPENAI_BASE_URL`，将使用 OpenAI 官方 API
- 确保目标服务兼容 OpenAI API 格式
- 某些服务可能需要调整模型名称

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
