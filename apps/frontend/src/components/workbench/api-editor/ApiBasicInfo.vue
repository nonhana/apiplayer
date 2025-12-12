<script lang="ts" setup>
import type { ApiDetail, ApiStatus, HttpMethod } from '@/types/api'
import { Check, Copy, Tag } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { methodBadgeColors, statusColors, statusLabels } from '@/constants/api'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** API 详情数据 */
  api: ApiDetail
}>()

/** 方法样式 */
const methodClass = computed(() => {
  const method = props.api.method as HttpMethod
  return methodBadgeColors[method] ?? 'bg-slate-500/15 text-slate-600'
})

/** 状态样式 */
const statusClass = computed(() => {
  const status = props.api.status as ApiStatus
  return statusColors[status] ?? 'bg-slate-500/15 text-slate-600'
})

/** 状态文案 */
const statusLabel = computed(() => {
  const status = props.api.status as ApiStatus
  return statusLabels[status] ?? props.api.status
})

/** 是否刚刚复制 */
const justCopied = ref(false)

/** 复制路径到剪贴板 */
async function handleCopyPath() {
  try {
    await navigator.clipboard.writeText(props.api.path)
    justCopied.value = true
    setTimeout(() => {
      justCopied.value = false
    }, 2000)
  }
  catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 接口名称和状态 -->
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-xl font-bold tracking-tight truncate">
        {{ api.name }}
      </h1>
      <Badge :class="cn('shrink-0', statusClass)">
        {{ statusLabel }}
      </Badge>
    </div>

    <!-- 请求方法和路径 -->
    <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
      <Badge :class="cn('font-bold text-xs px-2 py-1', methodClass)">
        {{ api.method }}
      </Badge>
      <code class="flex-1 font-mono text-sm truncate">
        {{ api.path }}
      </code>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7 shrink-0"
              @click="handleCopyPath"
            >
              <Check v-if="justCopied" class="h-4 w-4 text-emerald-600" />
              <Copy v-else class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {{ justCopied ? '已复制' : '复制路径' }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- 描述 -->
    <div v-if="api.description" class="text-sm text-muted-foreground leading-relaxed">
      {{ api.description }}
    </div>

    <!-- 标签 -->
    <div v-if="api.tags && api.tags.length > 0" class="flex items-center gap-2 flex-wrap">
      <Tag class="h-4 w-4 text-muted-foreground shrink-0" />
      <Badge
        v-for="tag in api.tags"
        :key="tag"
        variant="secondary"
        class="text-xs"
      >
        {{ tag }}
      </Badge>
    </div>
  </div>
</template>
