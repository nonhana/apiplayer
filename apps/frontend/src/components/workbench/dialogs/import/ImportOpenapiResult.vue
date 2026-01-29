<script lang="ts" setup>
import type { HttpMethod } from '@/types/api'
import type { ImportResult } from '@/types/import'
import { AlertCircle, CheckCircle2, FolderPlus, SkipForward, XCircle } from 'lucide-vue-next'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { methodColors } from '@/constants/api'

const props = defineProps<{
  result: ImportResult
}>()

const emits = defineEmits<{
  (e: 'close'): void
}>()

const isSuccess = computed(() => props.result.failedCount === 0)

const statusConfig = {
  created: {
    icon: CheckCircle2,
    label: '创建成功',
    class: 'text-green-600',
    badgeVariant: 'default' as const,
  },
  updated: {
    icon: CheckCircle2,
    label: '更新成功',
    class: 'text-blue-600',
    badgeVariant: 'secondary' as const,
  },
  skipped: {
    icon: SkipForward,
    label: '已跳过',
    class: 'text-muted-foreground',
    badgeVariant: 'outline' as const,
  },
  failed: {
    icon: XCircle,
    label: '失败',
    class: 'text-red-600',
    badgeVariant: 'destructive' as const,
  },
}

function getMethodClass(method: HttpMethod) {
  return methodColors[method] || 'text-gray-500'
}
</script>

<template>
  <div class="space-y-4">
    <!-- 结果状态 -->
    <div
      class="rounded-lg p-6 text-center"
      :class="isSuccess ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'"
    >
      <component
        :is="isSuccess ? CheckCircle2 : AlertCircle"
        class="h-12 w-12 mx-auto mb-3"
        :class="isSuccess ? 'text-green-600' : 'text-red-600'"
      />
      <h3 class="text-lg font-medium" :class="isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
        {{ isSuccess ? '导入成功' : '导入完成（部分失败）' }}
      </h3>
      <p class="text-sm text-muted-foreground mt-1">
        已处理 {{ result.results.length }} 个接口
      </p>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-4 gap-3">
      <div class="bg-muted/50 rounded-lg p-3 text-center">
        <div class="text-xl font-bold text-green-600">
          {{ result.createdCount }}
        </div>
        <div class="text-xs text-muted-foreground">
          创建
        </div>
      </div>
      <div class="bg-muted/50 rounded-lg p-3 text-center">
        <div class="text-xl font-bold text-blue-600">
          {{ result.updatedCount }}
        </div>
        <div class="text-xs text-muted-foreground">
          更新
        </div>
      </div>
      <div class="bg-muted/50 rounded-lg p-3 text-center">
        <div class="text-xl font-bold text-muted-foreground">
          {{ result.skippedCount }}
        </div>
        <div class="text-xs text-muted-foreground">
          跳过
        </div>
      </div>
      <div class="bg-muted/50 rounded-lg p-3 text-center">
        <div class="text-xl font-bold" :class="result.failedCount > 0 ? 'text-red-600' : 'text-muted-foreground'">
          {{ result.failedCount }}
        </div>
        <div class="text-xs text-muted-foreground">
          失败
        </div>
      </div>
    </div>

    <!-- 创建的分组 -->
    <div v-if="result.createdGroups.length > 0" class="space-y-2">
      <div class="flex items-center gap-2 text-sm font-medium">
        <FolderPlus class="h-4 w-4 text-primary" />
        新建分组
      </div>
      <div class="flex flex-wrap gap-2">
        <Badge v-for="group in result.createdGroups" :key="group" variant="secondary">
          {{ group }}
        </Badge>
      </div>
    </div>

    <!-- 详细结果列表 -->
    <div class="space-y-2">
      <div class="text-sm font-medium">
        导入详情
      </div>
      <ScrollArea class="h-[200px] rounded-md border">
        <div class="p-2 space-y-1">
          <div
            v-for="(item, index) in result.results"
            :key="index"
            class="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-muted"
          >
            <component
              :is="statusConfig[item.status].icon"
              class="h-4 w-4 shrink-0"
              :class="statusConfig[item.status].class"
            />
            <span
              class="font-mono text-xs font-bold w-14 shrink-0"
              :class="getMethodClass(item.method)"
            >
              {{ item.method }}
            </span>
            <span class="font-mono text-xs text-muted-foreground truncate flex-1">
              {{ item.path }}
            </span>
            <Badge :variant="statusConfig[item.status].badgeVariant" class="shrink-0">
              {{ statusConfig[item.status].label }}
            </Badge>
          </div>
        </div>
      </ScrollArea>
    </div>

    <!-- 失败详情 -->
    <div v-if="result.failedCount > 0" class="space-y-2">
      <div class="text-sm font-medium text-red-600">
        失败详情
      </div>
      <div class="bg-red-50 dark:bg-red-950/20 rounded-md p-3 space-y-2">
        <div
          v-for="(item, index) in result.results.filter(r => r.status === 'failed')"
          :key="index"
          class="text-sm"
        >
          <div class="font-medium">
            {{ item.method }} {{ item.path }}
          </div>
          <div class="text-red-600 text-xs">
            {{ item.error }}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end">
      <Button @click="emits('close')">
        完成
      </Button>
    </div>
  </div>
</template>
