<script lang="ts" setup>
import type { ApiResItem } from '@/types/api'
import { Check, ChevronDown, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import JsonSchemaPreviewer from '@/components/json-schema/JsonSchemaPreviewer.vue'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { httpStatusLabels } from '@/constants/api'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** 响应定义列表 */
  responses: ApiResItem[]
}>()

/** 是否有响应 */
const hasResponses = computed(() => props.responses.length > 0)

/** 展开状态（默认展开第一个） */
const expandedItems = ref<Set<number>>(new Set([0]))

/** 切换展开状态 */
function toggleExpand(index: number) {
  if (expandedItems.value.has(index)) {
    expandedItems.value.delete(index)
  }
  else {
    expandedItems.value.add(index)
  }
}

/** 是否展开 */
function isExpanded(index: number) {
  return expandedItems.value.has(index)
}

/** 获取状态码类型 */
function getStatusType(status: number) {
  if (status >= 200 && status < 300)
    return 'success'
  if (status >= 300 && status < 400)
    return 'redirect'
  if (status >= 400 && status < 500)
    return 'client-error'
  return 'server-error'
}

/** 状态码样式 */
const statusStyles = {
  'success': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'redirect': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'client-error': 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  'server-error': 'bg-red-500/15 text-red-600 border-red-500/30',
}

/** 获取状态码样式 */
function getStatusClass(status: number) {
  return statusStyles[getStatusType(status)]
}

/** 获取状态码描述 */
function getStatusLabel(status: number) {
  return httpStatusLabels[status as keyof typeof httpStatusLabels] ?? ''
}

/** 状态码图标 */
function getStatusIcon(status: number) {
  const type = getStatusType(status)
  return type === 'success' ? Check : X
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold">
        响应定义
      </h3>
      <span v-if="hasResponses" class="text-xs text-muted-foreground">
        共 {{ responses.length }} 个响应
      </span>
    </div>

    <div v-if="hasResponses" class="space-y-3">
      <Collapsible
        v-for="(response, index) in responses"
        :key="index"
        :open="isExpanded(index)"
        class="border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger
          class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors"
          @click="toggleExpand(index)"
        >
          <div class="flex items-center gap-3">
            <Badge :class="cn('font-mono text-xs px-2', getStatusClass(response.httpStatus))">
              <component
                :is="getStatusIcon(response.httpStatus)"
                class="h-3 w-3 mr-1"
              />
              {{ response.httpStatus }}
            </Badge>
            <span v-if="getStatusLabel(response.httpStatus)" class="text-xs text-muted-foreground">
              {{ getStatusLabel(response.httpStatus) }}
            </span>
            <Separator orientation="vertical" class="h-4" />
            <span class="text-sm font-medium">
              {{ response.name }}
            </span>
          </div>
          <ChevronDown
            :class="cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isExpanded(index) && 'rotate-180',
            )"
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div class="border-t p-4 space-y-4 bg-muted/20">
            <!-- 响应描述 -->
            <p
              v-if="response.description"
              class="text-sm text-muted-foreground"
            >
              {{ response.description }}
            </p>

            <!-- 响应体 -->
            <div v-if="response.body" class="space-y-2">
              <div class="text-sm font-medium">
                响应体
              </div>
              <JsonSchemaPreviewer :schema="response.body" max-height="300px" />
            </div>

            <!-- 响应头 -->
            <div v-if="response.headers && response.headers.length > 0" class="space-y-2">
              <div class="text-sm font-medium">
                响应头
              </div>
              <div class="space-y-1">
                <div
                  v-for="header in response.headers"
                  :key="header.name"
                  class="flex items-center gap-2 text-sm"
                >
                  <code class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    {{ header.name }}
                  </code>
                  <span class="text-muted-foreground">{{ header.description ?? header.type }}</span>
                </div>
              </div>
            </div>

            <!-- 无内容提示 -->
            <div
              v-if="!response.body && !response.example && (!response.headers || response.headers.length === 0)"
              class="text-center py-4 text-muted-foreground text-sm"
            >
              暂无详细定义
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <!-- 无响应 -->
    <div
      v-else
      class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30"
    >
      暂无响应定义
    </div>
  </div>
</template>
