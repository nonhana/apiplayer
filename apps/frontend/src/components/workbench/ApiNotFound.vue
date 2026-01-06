<script lang="ts" setup>
import { FileQuestion, RotateCcw, Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

defineProps<{
  apiId: string
}>()

const emits = defineEmits<{
  (e: 'refresh'): void
}>()

const router = useRouter()
</script>

<template>
  <div class="absolute inset-0 flex items-center justify-center bg-background">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div class="absolute bottom-1/3 right-1/3 w-48 h-48 bg-muted-foreground/5 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 text-center max-w-md px-6">
      <div class="relative mb-6">
        <div class="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 shadow-sm">
          <FileQuestion class="w-10 h-10 text-muted-foreground" />
        </div>
      </div>

      <h2 class="text-xl font-semibold text-foreground mb-2">
        API 未找到
      </h2>

      <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
        抱歉，找不到 ID 为
        <code class="px-1.5 py-0.5 mx-0.5 bg-muted rounded text-xs font-mono text-foreground/80">
          {{ apiId }}
        </code>
        的 API
      </p>
      <p class="text-sm text-muted-foreground mb-6">
        可能是该 API 已被删除，或者您输入的 ID 有误
      </p>

      <div class="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" @click="router.back">
          <Search class="w-4 h-4 mr-1.5" />
          返回上一页
        </Button>
        <Button size="sm" @click="emits('refresh')">
          <RotateCcw class="w-4 h-4 mr-1.5" />
          刷新重试
        </Button>
      </div>
    </div>
  </div>
</template>
