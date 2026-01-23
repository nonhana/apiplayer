<script lang="ts" setup>
import {
  ExternalLink,
  GitBranch,
  Github,
  Heart,
  Server,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Layout from './Layout.vue'

/** 版本号 */
const version = __APP_VERSION__

/** 技术栈标签 */
const techStack = [
  { label: 'Vue 3', variant: 'default' as const },
  { label: 'TypeScript', variant: 'default' as const },
  { label: 'Tailwind CSS', variant: 'secondary' as const },
  { label: 'shadcn-vue', variant: 'secondary' as const },
  { label: 'NestJS', variant: 'outline' as const },
  { label: 'PostgreSQL', variant: 'outline' as const },
]

/** 相关链接 */
const links = [
  {
    icon: Github,
    label: 'GitHub',
    href: 'https://github.com/nonhana/apiplayer',
  },
  {
    icon: GitBranch,
    label: '查看更新日志',
    href: 'https://github.com/nonhana/apiplayer/releases',
  },
]
</script>

<template>
  <Layout title="关于" description="关于本应用的详细信息">
    <!-- 应用标识 -->
    <div class="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
      <div class="relative">
        <img src="/logo.svg" alt="logo" class="w-14 h-14 rounded-xl shadow-sm">
        <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
          <Server class="w-3 h-3 text-white" />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-xl font-semibold tracking-tight">
          ApiPlayer
        </h1>
        <Badge variant="secondary" class="text-xs">
          v{{ version }}
        </Badge>
      </div>
    </div>

    <!-- 项目简介 -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium">
        项目简介
      </h4>
      <p class="text-sm text-muted-foreground leading-relaxed">
        ApiPlayer 是一个类 ApiFox / Postman 的 Web 端 API 管理平台，旨在为开发团队提供轻量、高效的 API 文档管理与调试体验——无需繁琐的软件安装与项目配置，打开浏览器即可协作。
      </p>
    </div>

    <Separator />

    <!-- 技术栈 -->
    <div class="space-y-3">
      <h4 class="text-sm font-medium">
        技术栈
      </h4>
      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="tech in techStack"
          :key="tech.label"
          :variant="tech.variant"
          class="text-xs"
        >
          {{ tech.label }}
        </Badge>
      </div>
    </div>

    <Separator />

    <!-- 相关链接 -->
    <div class="space-y-3">
      <h4 class="text-sm font-medium">
        相关链接
      </h4>
      <div class="space-y-1">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.href"
          target="_blank"
          class="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors group"
        >
          <component :is="link.icon" class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span class="text-sm flex-1">{{ link.label }}</span>
          <ExternalLink class="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>

    <!-- 许可证 & 作者 -->
    <template #footer>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2 text-muted-foreground">
          <span>MIT License</span>
          <span>•</span>
          <span>100% 开源</span>
        </div>
        <a
          href="https://github.com/nonhana"
          target="_blank"
          class="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <span>Made with</span>
          <Heart class="w-3 h-3 text-red-500 fill-red-500" />
          <span>by nonhana</span>
        </a>
      </div>
    </template>
  </Layout>
</template>
