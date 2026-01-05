<script lang="ts" setup>
import type { ApiVersionComparison, DiffItem } from '@/types/version'
import {
  ArrowRight,
  Check,
  GitCompare,
  Loader2,
  Minus,
  Plus,
  X,
} from 'lucide-vue-next'
import { computed, ref, toRaw, watch } from 'vue'
import { versionApi } from '@/api/version'
import CodeBlock from '@/components/common/CodeBlock.vue'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { methodBadgeColors } from '@/constants/api'
import { versionDiffFieldLabels, versionStatusColors, versionStatusLabels } from '@/constants/version'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** 项目 ID */
  projectId: string
  /** API ID */
  apiId: string
  /** 源版本 ID */
  fromVersionId: string | null
  /** 目标版本 ID */
  toVersionId: string | null
}>()

defineEmits<{
  (e: 'close'): void
}>()

type DiffField = DiffItem & { field: string }

interface ComparisonResult {
  baseInfo: DiffField[]
  params: DiffField[]
  body: DiffField[]
  responses: DiffField[]
  other: DiffField[]
}

const isOpen = defineModel<boolean>('open', { required: true })

/** 比较结果 */
const comparison = ref<ApiVersionComparison | null>(null)

/** 加载状态 */
const isLoading = ref(false)

/** 加载错误 */
const loadError = ref<string | null>(null)

/** 差异项列表 */
const diffItems = computed<DiffField[]>(() => {
  if (!comparison.value?.diff)
    return []
  const diffItems = Object.values(toRaw(comparison.value.diff))

  const result: DiffField[] = []

  for (const diffItem of diffItems) {
    result.push(...Object.entries(diffItem).map(([field, value]) => ({
      field,
      ...value,
    })))
  }

  return result
})

/** 是否有差异 */
const hasDiff = computed(() => diffItems.value.length > 0)

/** 差异分类 */
const categorizedDiffs = computed(() => {
  const baseInfoFields = ['name', 'method', 'path', 'description', 'tags', 'status', 'sortOrder']
  const paramsFields = ['pathParams', 'queryParams', 'requestHeaders']
  const bodyFields = ['requestBody']
  const responseFields = ['responses']
  const otherFields = ['mockConfig', 'examples']

  const result: ComparisonResult = {
    baseInfo: [],
    params: [],
    body: [],
    responses: [],
    other: [],
  }

  for (const diff of diffItems.value) {
    if (baseInfoFields.includes(diff.field)) {
      result.baseInfo.push(diff)
    }
    else if (paramsFields.includes(diff.field)) {
      result.params.push(diff)
    }
    else if (bodyFields.includes(diff.field)) {
      result.body.push(diff)
    }
    else if (responseFields.includes(diff.field)) {
      result.responses.push(diff)
    }
    else if (otherFields.includes(diff.field)) {
      result.other.push(diff)
    }
  }

  return result
})

/** 格式化值用于展示 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(空)'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

/** 判断值是否为复杂对象 */
function isComplexValue(value: unknown): boolean {
  return typeof value === 'object' && value !== null
}

/** 获取比较数据 */
async function fetchComparison() {
  if (!props.fromVersionId || !props.toVersionId)
    return

  isLoading.value = true
  loadError.value = null

  try {
    comparison.value = await versionApi.compareVersions(
      props.projectId,
      props.apiId,
      props.fromVersionId,
      props.toVersionId,
    )
  }
  catch (err) {
    loadError.value = `获取比较数据失败: ${err}`
    console.error('Failed to fetch comparison:', err)
  }
  finally {
    isLoading.value = false
  }
}

/** 监听版本 ID 变化 */
watch(
  () => [props.fromVersionId, props.toVersionId],
  ([from, to]) => {
    if (from && to && isOpen.value) {
      fetchComparison()
    }
    else {
      comparison.value = null
    }
  },
)

/** 监听面板打开 */
watch(isOpen, (open) => {
  if (open && props.fromVersionId && props.toVersionId) {
    fetchComparison()
  }
})
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="sm:max-w-4xl flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4 border-b">
        <div class="flex items-center gap-3">
          <GitCompare class="h-5 w-5 text-muted-foreground" />
          <div class="flex-1">
            <SheetTitle>版本对比</SheetTitle>
            <SheetDescription v-if="comparison">
              <div class="flex items-center gap-2 mt-1">
                <span class="font-mono text-sm text-foreground">
                  v{{ comparison.from.version }}
                </span>
                <ArrowRight class="h-4 w-4" />
                <span class="font-mono text-sm text-foreground">
                  v{{ comparison.to.version }}
                </span>
              </div>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <!-- 加载状态 -->
      <div
        v-if="isLoading"
        class="flex-1 flex items-center justify-center"
      >
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="loadError"
        class="flex-1 flex items-center justify-center text-destructive"
      >
        {{ loadError }}
      </div>

      <!-- 比较结果 -->
      <ScrollArea v-else-if="comparison" class="h-[calc(100dvh-8.25rem)]">
        <div class="p-6 space-y-6">
          <!-- 版本信息对比 -->
          <div class="grid grid-cols-2 gap-4">
            <!-- From 版本 -->
            <div class="p-4 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20">
              <div class="flex items-center gap-2 mb-2">
                <Minus class="h-4 w-4 text-rose-600" />
                <span class="font-mono font-semibold">
                  v{{ comparison.from.version }}
                </span>
                <Badge
                  variant="outline"
                  :class="cn('text-xs', versionStatusColors[comparison.from.status])"
                >
                  {{ versionStatusLabels[comparison.from.status] }}
                </Badge>
              </div>
              <div class="text-sm text-muted-foreground space-y-1">
                <div class="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    :class="cn('text-xs font-bold', methodBadgeColors[comparison.from.method])"
                  >
                    {{ comparison.from.method }}
                  </Badge>
                  <code class="text-xs">{{ comparison.from.path }}</code>
                </div>
                <p>{{ comparison.from.name }}</p>
              </div>
            </div>

            <!-- To 版本 -->
            <div class="p-4 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20">
              <div class="flex items-center gap-2 mb-2">
                <Plus class="h-4 w-4 text-emerald-600" />
                <span class="font-mono font-semibold">
                  v{{ comparison.to.version }}
                </span>
                <Badge
                  variant="outline"
                  :class="cn('text-xs', versionStatusColors[comparison.to.status])"
                >
                  {{ versionStatusLabels[comparison.to.status] }}
                </Badge>
              </div>
              <div class="text-sm text-muted-foreground space-y-1">
                <div class="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    :class="cn('text-xs font-bold', methodBadgeColors[comparison.to.method])"
                  >
                    {{ comparison.to.method }}
                  </Badge>
                  <code class="text-xs">{{ comparison.to.path }}</code>
                </div>
                <p>{{ comparison.to.name }}</p>
              </div>
            </div>
          </div>

          <Separator />

          <!-- 无差异 -->
          <div
            v-if="!hasDiff"
            class="flex flex-col items-center justify-center py-12 text-muted-foreground"
          >
            <Check class="h-12 w-12 text-emerald-500 mb-4" />
            <span class="text-lg font-medium">两个版本内容完全一致</span>
            <span class="text-sm">没有检测到任何差异</span>
          </div>

          <!-- 差异详情 -->
          <template v-else>
            <!-- 基本信息变更 -->
            <div v-if="categorizedDiffs.baseInfo.length > 0" class="space-y-3">
              <h4 class="text-sm font-medium text-muted-foreground">
                基本信息变更 ({{ categorizedDiffs.baseInfo.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="diff in categorizedDiffs.baseInfo"
                  :key="diff.field"
                  class="p-3 rounded-lg border bg-muted/20"
                >
                  <div class="font-medium text-sm mb-2">
                    {{ versionDiffFieldLabels[diff.field] }}
                  </div>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                      <div class="flex items-center gap-1 text-xs text-rose-600 mb-1">
                        <X class="h-3 w-3" />
                        旧值
                      </div>
                      <div
                        v-if="isComplexValue(diff.from)"
                        class="max-h-32 overflow-auto"
                      >
                        <CodeBlock :code="formatValue(diff.from)" lang="json" :show-header="false" />
                      </div>
                      <span v-else class="text-muted-foreground">
                        {{ formatValue(diff.from) }}
                      </span>
                    </div>
                    <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div class="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                        <Check class="h-3 w-3" />
                        新值
                      </div>
                      <div
                        v-if="isComplexValue(diff.to)"
                        class="max-h-32 overflow-auto"
                      >
                        <CodeBlock :code="formatValue(diff.to)" lang="json" :show-header="false" />
                      </div>
                      <span v-else class="text-muted-foreground">
                        {{ formatValue(diff.to) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 参数变更 -->
            <div v-if="categorizedDiffs.params.length > 0" class="space-y-3">
              <h4 class="text-sm font-medium text-muted-foreground">
                请求参数变更 ({{ categorizedDiffs.params.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="diff in categorizedDiffs.params"
                  :key="diff.field"
                  class="p-3 rounded-lg border bg-muted/20"
                >
                  <div class="font-medium text-sm mb-2">
                    {{ versionDiffFieldLabels[diff.field] }}
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                      <div class="flex items-center gap-1 text-xs text-rose-600 mb-1">
                        <X class="h-3 w-3" />
                        旧值
                      </div>
                      <CodeBlock
                        :code="formatValue(diff.from)"
                        lang="json"
                        :show-header="false"
                      />
                    </div>
                    <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div class="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                        <Check class="h-3 w-3" />
                        新值
                      </div>
                      <CodeBlock
                        :code="formatValue(diff.to)"
                        lang="json"
                        :show-header="false"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 请求体变更 -->
            <div v-if="categorizedDiffs.body.length > 0" class="space-y-3">
              <h4 class="text-sm font-medium text-muted-foreground">
                请求体变更
              </h4>
              <div
                v-for="diff in categorizedDiffs.body"
                :key="diff.field"
                class="p-3 rounded-lg border bg-muted/20"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                    <div class="flex items-center gap-1 text-xs text-rose-600 mb-1">
                      <X class="h-3 w-3" />
                      旧值
                    </div>
                    <CodeBlock
                      :code="formatValue(diff.from)"
                      lang="json"
                      :show-header="false"
                    />
                  </div>
                  <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div class="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                      <Check class="h-3 w-3" />
                      新值
                    </div>
                    <CodeBlock
                      :code="formatValue(diff.to)"
                      lang="json"
                      :show-header="false"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 响应定义变更 -->
            <div v-if="categorizedDiffs.responses.length > 0" class="space-y-3">
              <h4 class="text-sm font-medium text-muted-foreground">
                响应定义变更
              </h4>
              <div
                v-for="diff in categorizedDiffs.responses"
                :key="diff.field"
                class="p-3 rounded-lg border bg-muted/20"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                    <div class="flex items-center gap-1 text-xs text-rose-600 mb-1">
                      <X class="h-3 w-3" />
                      旧值
                    </div>
                    <CodeBlock
                      :code="formatValue(diff.from)"
                      lang="json"
                      :show-header="false"
                    />
                  </div>
                  <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div class="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                      <Check class="h-3 w-3" />
                      新值
                    </div>
                    <CodeBlock
                      :code="formatValue(diff.to)"
                      lang="json"
                      :show-header="false"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 其他变更 -->
            <div v-if="categorizedDiffs.other.length > 0" class="space-y-3">
              <h4 class="text-sm font-medium text-muted-foreground">
                其他变更 ({{ categorizedDiffs.other.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="diff in categorizedDiffs.other"
                  :key="diff.field"
                  class="p-3 rounded-lg border bg-muted/20"
                >
                  <div class="font-medium text-sm mb-2">
                    {{ versionDiffFieldLabels[diff.field] }}
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                      <div class="flex items-center gap-1 text-xs text-rose-600 mb-1">
                        <X class="h-3 w-3" />
                        旧值
                      </div>
                      <CodeBlock
                        :code="formatValue(diff.from)"
                        lang="json"
                        :show-header="false"
                      />
                    </div>
                    <div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div class="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                        <Check class="h-3 w-3" />
                        新值
                      </div>
                      <CodeBlock
                        :code="formatValue(diff.to)"
                        lang="json"
                        :show-header="false"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
</template>
