<p align="center">
  <img src="https://static-r2.caelum.moe/apiplayer-logo.svg" width="80" height="80" alt="ApiPlayer Logo">
</p>

<h1 align="center">ApiPlayer</h1>

<p align="center">
  开源免费的 Web 端 API 管理平台，无需下载软件，打开浏览器即可开始工作。
</p>

<p align="center">
  <a href="#核心功能">功能</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#快速开始">快速开始</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

---

## 简介

ApiPlayer 是一个类 [ApiFox](https://apifox.com) / [Postman](https://www.postman.com) 的 **Web 端 API 管理平台**。它旨在为开发团队提供轻量、高效的 API 文档管理与调试体验——无需繁琐的软件安装与项目配置，打开浏览器即可协作。

## 核心功能

### API 管理

- **可视化编辑** — 直观的表单式 API 定义，支持请求参数、请求体、响应结构的完整配置
- **分组管理** — 树形目录结构，支持拖拽排序与嵌套分组
- **版本控制** — 每次修改自动生成版本快照，支持版本对比与回滚
- **Mock 数据** — 基于 JSON Schema 自动生成 Mock 数据

### API 调试

- **在线运行** — 直接在浏览器中发送 HTTP 请求，后端代理转发绕过 CORS 限制
- **环境变量** — 多环境配置（开发/测试/生产），一键切换 BaseURL
- **cURL 生成** — 根据当前配置自动生成 cURL 命令，方便复制分享

### 团队协作

- **团队管理** — 创建团队、邀请成员、角色分配
- **项目隔离** — 每个项目独立的成员权限与环境配置
- **RBAC 权限** — 细粒度的权限控制，支持团队/项目双层级

### 安全设计

- **Cookie + Session** — 安全的会话管理，支持多设备登录与会话管理
- **上下文权限** — 基于资源上下文的权限校验，防止权限越界

## 技术栈

| 层级 | 技术 |
| ---- | ---- |
| **前端** | Vue 3 + TypeScript + Vite + Tailwind CSS + shadcn-vue |
| **后端** | NestJS + Fastify + Prisma + PostgreSQL + Redis |
| **部署** | PM2 + Nginx + GitHub Actions CI/CD |
| **架构** | pnpm Monorepo |

## 项目结构

```plaintext
apiplayer/
├── apps/
│   ├── frontend/          # Vue 3 前端应用
│   │   ├── src/
│   │   │   ├── api/       # API 请求封装
│   │   │   ├── components/# UI 组件
│   │   │   ├── composables/# 逻辑复用
│   │   │   ├── stores/    # Pinia 状态管理
│   │   │   └── views/     # 页面组件
│   │   └── ...
│   └── backend/           # NestJS 后端服务
│       ├── src/
│       │   ├── api/       # API 模块
│       │   ├── auth/      # 认证模块
│       │   ├── team/      # 团队模块
│       │   ├── project/   # 项目模块
│       │   └── ...
│       └── prisma/        # 数据库 Schema
├── docs/                  # 项目文档
└── .github/workflows/     # CI/CD 配置
```

## 快速开始

### 环境要求

- Node.js >= 20.x
- pnpm >= 10.x
- PostgreSQL >= 14
- Redis >= 6

### 本地开发

```bash
# 克隆项目
git clone https://github.com/nonhana/apiplayer.git
cd apiplayer

# 安装依赖
pnpm install

# 配置后端环境变量
cp apps/backend/.env.example apps/backend/.env
# 编辑 .env 文件，配置数据库等信息

# 初始化数据库
cd apps/backend
pnpm prisma:push
pnpm rbac:seed

# 启动开发服务器
cd ../..
pnpm dev:backend   # 启动后端 (默认端口 3000)
pnpm dev:frontend  # 启动前端 (默认端口 5173)
```

### 构建生产版本

```bash
pnpm build:frontend  # 构建前端
pnpm build:backend   # 构建后端
```

## 贡献

**项目仍在积极开发中，部分功能有待完善**，欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT](./LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/nonhana">nonhana</a>
</p>
