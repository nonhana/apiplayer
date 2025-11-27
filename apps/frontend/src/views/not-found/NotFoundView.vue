<script lang="ts" setup>
import { ArrowLeft, Home } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-destructive/5 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 text-center max-w-md">
      <div class="relative mb-8">
        <span
          class="text-[10rem] sm:text-[12rem] font-black leading-none tracking-tighter bg-linear-to-b from-muted-foreground/20 to-transparent bg-clip-text text-transparent select-none"
        >
          404
        </span>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-6xl sm:text-7xl font-bold text-foreground">
            404
          </span>
        </div>
      </div>

      <!-- Message -->
      <h1 class="text-2xl sm:text-3xl font-semibold mb-3">
        页面未找到
      </h1>
      <p class="text-muted-foreground mb-8 leading-relaxed">
        抱歉，您访问的页面不存在或已被移除。
        <br>
        请检查地址是否正确，或返回首页继续浏览。
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="outline" class="w-full sm:w-auto" @click="goBack">
          <ArrowLeft class="mr-2 h-4 w-4" />
          返回上一页
        </Button>
        <Button class="w-full sm:w-auto" @click="goHome">
          <Home class="mr-2 h-4 w-4" />
          回到首页
        </Button>
      </div>
    </div>

    <!-- Footer -->
    <p class="absolute bottom-6 text-xs text-muted-foreground/50">
      ApiPlayer · 现代化 API 管理平台
    </p>
  </div>
</template>
