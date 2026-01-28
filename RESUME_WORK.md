# 项目恢复指南

## 📍 当前工作状态

### 项目位置
- **主项目目录:** `/Users/felixwang/devspace/work-exp/zcf-demo1`
- **Worktree 目录:** `.worktrees/basic-search`
- **当前分支:** master
- **开发分支:** feature/basic-search

### 远程仓库
- **GitHub:** https://github.com/deepeye/zcf-search
- **已推送:** master 分支

---

## 🚀 快速启动工作

### 方式一: 继续在主项目目录工作

```bash
# 进入主项目目录
cd /Users/felixwang/devspace/work-exp/zcf-demo1

# 查看当前状态
git status
git log --oneline -5

# 查看所有分支
git branch -a

# 拉取最新更新
git pull origin master
```

### 方式二: 使用 Worktree 继续开发

```bash
# 进入 worktree 目录
cd /Users/felixwang/devspace/work-exp/zcf-demo1/.worktrees/basic-search

# 查看当前分支
git branch

# 拉取最新更新
git pull origin feature/basic-search
```

---

## 📋 项目结构

```
zcf-demo1/                          # 主项目目录
├── .worktrees/                     # Git worktrees 目录
│   └── basic-search/               # 开发用的 worktree
│       ├── src/                    # 源代码
│       ├── prisma/                 # 数据库 schema
│       └── ...                     # 其他项目文件
├── src/                            # 主项目源代码 (已合并)
├── docs/                           # 文档
│   ├── plans/                      # 实施计划
│   ├── basic-search-mvp-summary.md
│   └── local-development.md
├── docker-compose.yml              # Docker Compose 配置
├── .env.example                    # 环境变量模板
└── README.md                       # 项目说明
```

---

## 🔧 常用命令

### 查看项目状态

```bash
# 主项目目录
cd /Users/felixwang/devspace/work-exp/zcf-demo1
git status
git log --oneline --graph -10

# Worktree 目录
cd /Users/felixwang/devspace/work-exp/zcf-demo1/.worktrees/basic-search
git status
git log --oneline -5
```

### 启动开发服务器

```bash
# 在主项目或 worktree 目录
cd /Users/felixwang/devspace/work-exp/zcf-demo1

# 启动数据库
docker-compose up -d

# 安装依赖 (如果需要)
npm install

# 生成 Prisma Client
npx prisma generate

# 启动开发服务器
npm run dev
```

### 查看开发文档

```bash
# 本地开发指南
cat docs/local-development.md

# MVP 总结
cat docs/basic-search-mvp-summary.md

# 实施计划
cat docs/plans/2025-01-28-basic-search-mvp.md
```

---

## 🎯 继续开发 Phase 2

### 创建新的功能分支

```bash
# 在主项目目录
cd /Users/felixwang/devspace/work-exp/zcf-demo1

# 拉取最新代码
git pull origin master

# 创建新的功能分支
git checkout -b feature/oauth-auth
# 或
git checkout -b feature/media-search
# 或
git checkout -b feature/streaming-response

# 创建新的 worktree (可选)
git worktree add .worktrees/oauth-auth -b feature/oauth-auth
```

### 开发流程

1. **创建功能分支** → `git checkout -b feature/xxx`
2. **开发功能** → 编写代码
3. **提交代码** → `git add . && git commit -m "feat: xxx"`
4. **推送到远程** → `git push -u origin feature/xxx`
5. **创建 Pull Request** (可选)
6. **合并到 master** → `git checkout master && git merge feature/xxx`

---

## 📝 重要文件说明

### 配置文件
- `.env.example` - 环境变量模板
- `docker-compose.yml` - PostgreSQL 容器配置
- `vercel.json` - Vercel 部署配置
- `package.json` - 项目依赖

### 核心代码
- `src/app/api/search/route.ts` - 搜索 API 端点
- `src/lib/ai.ts` - AI 答案生成服务
- `src/lib/search.ts` - 搜索服务
- `src/components/` - React 组件

### 文档
- `README.md` - 项目说明
- `docs/local-development.md` - 本地开发指南
- `docs/basic-search-mvp-summary.md` - MVP 总结

---

## 🔍 快速诊断

### 检查项目是否正常

```bash
# 1. 检查 Git 状态
git status

# 2. 检查分支
git branch -a

# 3. 检查远程仓库
git remote -v

# 4. 检查最新提交
git log --oneline -3

# 5. 检查文件结构
ls -la src/
```

### 常见问题

**Q: 如何查看当前在哪个分支?**
```bash
git branch
git status
```

**Q: worktree 还需要吗?**
```bash
# worktree 已经完成使命,可以删除
git worktree remove .worktrees/basic-search

# 或保留用于未来开发
# 保持独立的工作环境
```

**Q: 如何同步远程更新?**
```bash
git pull origin master
```

**Q: 如何查看未完成的功能?**
```bash
cat docs/plans/2025-01-28-basic-search-mvp.md
# 查看文档中的 "Phase 2" 部分
```

---

## 💡 推荐工作流

### 日常开发

```bash
# 1. 进入项目目录
cd /Users/felixwang/devspace/work-exp/zcf-demo1

# 2. 拉取最新更新
git pull origin master

# 3. 创建功能分支
git checkout -b feature/your-feature

# 4. 开发并提交
git add .
git commit -m "feat: your feature description"

# 5. 推送到远程
git push -u origin feature/your-feature

# 6. 合并到 master
git checkout master
git merge feature/your-feature
git push origin master
```

---

## 📞 需要帮助?

如果遇到问题，可以：

1. **查看文档** - `docs/` 目录有完整的开发指南
2. **检查 Git 历史** - `git log --oneline` 查看所有提交
3. **查看配置** - `.env.example` 和 `README.md`

---

**最后更新:** 2025-01-28
**项目状态:** MVP 已完成，已推送到 GitHub
