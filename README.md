<p align="center">
  <img src="https://static-r2.caelum.moe/apiplayer-logo.svg" width="80" height="80" alt="ApiPlayer Logo">
</p>

<h1 align="center">ApiPlayer</h1>

<p align="center">
  An open-source, web-based API management platform. No downloads required — just open your browser and start working.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#getting-started">Getting Started</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a>
</p>

---

## Introduction

ApiPlayer is a **web-based API management platform** similar to [ApiFox](https://apifox.com) and [Postman](https://www.postman.com). It provides development teams with a lightweight and efficient API documentation and debugging experience — no software installation or project configuration required, just open your browser and collaborate.

## Features

### API Management

- **Visual Editor** — Intuitive form-based API definition with full support for request parameters, body, and response structures
- **Group Management** — Tree-structured directories with drag-and-drop sorting and nested groups
- **Version Control** — Automatic version snapshots on every modification, with diff comparison and rollback support
- **Mock Data** — Auto-generate mock data based on JSON Schema

### API Debugging

- **Online Runner** — Send HTTP requests directly in the browser, with backend proxy to bypass CORS restrictions
- **Environment Variables** — Multi-environment configuration (dev/test/prod) with one-click BaseURL switching
- **cURL Generation** — Auto-generate cURL commands from current configuration for easy sharing

### Team Collaboration

- **Team Management** — Create teams, invite members, and assign roles
- **Project Isolation** — Independent member permissions and environment settings per project
- **RBAC Permissions** — Fine-grained access control with team/project dual-level hierarchy

### Security

- **Cookie + Session** — Secure session management with multi-device login and session control
- **Context-aware Permissions** — Resource context-based permission validation to prevent privilege escalation

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| **Frontend** | Vue 3 + TypeScript + Vite + Tailwind CSS + shadcn-vue |
| **Backend** | NestJS + Fastify + Prisma + PostgreSQL + Redis |
| **Deployment** | PM2 + Nginx + GitHub Actions CI/CD |
| **Architecture** | pnpm Monorepo |

## Project Structure

```plaintext
apiplayer/
├── apps/
│   ├── frontend/          # Vue 3 frontend application
│   │   ├── src/
│   │   │   ├── api/       # API request wrappers
│   │   │   ├── components/# UI components
│   │   │   ├── composables/# Composable hooks
│   │   │   ├── stores/    # Pinia state management
│   │   │   └── views/     # Page components
│   │   └── ...
│   └── backend/           # NestJS backend service
│       ├── src/
│       │   ├── api/       # API module
│       │   ├── auth/      # Authentication module
│       │   ├── team/      # Team module
│       │   ├── project/   # Project module
│       │   └── ...
│       └── prisma/        # Database schema
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD configuration
```

## Getting Started

### Requirements

- Node.js >= 20.x
- pnpm >= 10.x
- PostgreSQL >= 14
- Redis >= 6

### Local Development

```bash
# Clone the repository
git clone https://github.com/nonhana/apiplayer.git
cd apiplayer

# Install dependencies
pnpm install

# Configure backend environment variables
cp apps/backend/.env.example apps/backend/.env
# Edit .env file with your database credentials

# Initialize database
cd apps/backend
pnpm prisma:push
pnpm rbac:seed

# Start development servers
cd ../..
pnpm dev:backend   # Start backend (default port 3000)
pnpm dev:frontend  # Start frontend (default port 5173)
```

### Production Build

```bash
pnpm build:frontend  # Build frontend
pnpm build:backend   # Build backend
```

## Contributing

**This project is under active development and some features are still being refined.** Issues and Pull Requests are welcome!

## License

[MIT](./LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/nonhana">nonhana</a>
</p>
