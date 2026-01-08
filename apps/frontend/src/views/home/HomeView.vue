<script lang="ts" setup>
import { ArrowRight, Github, Globe, Layers, Zap } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const router = useRouter()

const GITHUB_URL = 'https://github.com/nonhana/apiplayer'

const features = [
  {
    icon: Layers,
    title: 'API 分组管理',
    description: '支持无限层级的分组结构，轻松组织海量接口。',
  },
  {
    icon: Zap,
    title: '快速调试',
    description: '一键发送请求，实时查看响应，提升开发效率。',
  },
  {
    icon: Globe,
    title: '多环境切换',
    description: '开发、测试、生产环境一键切换，告别手动修改。',
  },
]

function goLogin() {
  router.push('/auth/login')
}

function goRegister() {
  router.push('/auth/register')
}
</script>

<template>
  <div class="relative flex flex-col items-center min-h-dvh bg-zinc-50">
    <header class="w-full px-6 py-4">
      <nav class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/logo.svg" alt="ApiPlayer Logo" class="w-9 h-9">
          <span class="text-lg font-semibold text-foreground tracking-tight">ApiPlayer</span>
        </div>

        <a
          :href="GITHUB_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Github class="w-4 h-4" />
          <span class="hidden sm:inline">GitHub</span>
        </a>
      </nav>
    </header>

    <main class="flex-1 flex flex-col items-center justify-center py-12 px-4 w-full">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <div class="mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg shadow-primary/20">
            <img src="/logo.svg" alt="ApiPlayer" class="w-20 h-20">
          </div>
        </div>

        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6"
        >
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          开源免费 · 持续更新
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          现代化 API 管理平台
        </h1>

        <p class="text-lg text-muted-foreground leading-relaxed mb-8">
          ApiPlayer 是一款轻量、优雅的 Web 端 API 管理与调试工具，
          <br class="hidden sm:block">
          让你无需下载任何软件，即可享受专业级的接口管理体验。
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" class="w-full sm:w-auto" @click="goLogin">
            立即登录
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" class="w-full sm:w-auto" @click="goRegister">
            免费注册
          </Button>
        </div>
      </div>

      <Separator class="max-w-md w-full mb-12" />

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full">
        <Card
          v-for="feature in features"
          :key="feature.title"
          class="group border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
          <CardHeader>
            <div
              class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors"
            >
              <component :is="feature.icon" class="h-5 w-5 text-primary" />
            </div>
            <CardTitle class="text-base">
              {{ feature.title }}
            </CardTitle>
            <CardDescription class="text-sm">
              {{ feature.description }}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>

    <footer class="w-full py-6 px-4">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
        <p>登录后即可创建团队、管理项目、调试接口，开启高效协作之旅。</p>
        <a
          :href="GITHUB_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <Github class="w-3.5 h-3.5" />
          <span>Star on GitHub</span>
        </a>
      </div>
    </footer>
  </div>
</template>
