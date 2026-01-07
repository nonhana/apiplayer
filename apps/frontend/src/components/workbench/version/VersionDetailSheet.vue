<script lang="ts" setup>
import type { ApiVersionDetail } from '@/types/version'
import {
  Archive,
  CheckCircle2,
  Clock,
  FileCode,
  Loader2,
  Rocket,
  RotateCcw,
  Tag,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { versionApi } from '@/api/version'
import CodeBlock from '@/components/common/CodeBlock.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  versionChangeTypeColors,
  versionChangeTypeLabels,
  versionStatusColors,
  versionStatusLabels,
} from '@/constants/version'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

const props = defineProps<{
  projectId: string
  apiId: string
  versionId: string | null
  isCurrent?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:versionData', data: ApiVersionDetail | null): void
  (e: 'publish'): void
  (e: 'archive'): void
  (e: 'rollback'): void
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const versionDetail = ref<ApiVersionDetail | null>(null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

const createdTimeFormatted = computed(() => {
  if (!versionDetail.value)
    return ''
  return dayjs(versionDetail.value.createdAt).format('YYYY-MM-DD HH:mm:ss')
})

const publishedTimeFormatted = computed(() => {
  if (!versionDetail.value?.publishedAt)
    return null
  return dayjs(versionDetail.value.publishedAt).format('YYYY-MM-DD HH:mm:ss')
})

const canPublish = computed(() => versionDetail.value?.status === 'DRAFT')
const canArchive = computed(() => versionDetail.value?.status !== 'ARCHIVED')
const canRollback = computed(() => versionDetail.value?.status === 'ARCHIVED')

const requestBodyPreview = computed(() => {
  if (!versionDetail.value?.requestBody)
    return null
  return JSON.stringify(versionDetail.value.requestBody, null, 2)
})

const responsesPreview = computed(() => {
  if (!versionDetail.value?.responses?.length)
    return null
  return JSON.stringify(versionDetail.value.responses, null, 2)
})

async function fetchVersionDetail() {
  if (!props.versionId)
    return

  isLoading.value = true
  loadError.value = null

  try {
    const detail = await versionApi.getVersionDetail(
      props.projectId,
      props.apiId,
      props.versionId,
    )
    versionDetail.value = detail
    emits('update:versionData', detail)
  }
  catch (error) {
    loadError.value = `获取版本详情失败: ${error}`
    console.error('Failed to fetch version detail:', error)
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => props.versionId,
  (newId) => {
    if (newId && isOpen.value) {
      fetchVersionDetail()
    }
    else {
      versionDetail.value = null
    }
  },
)

watch(isOpen, (open) => {
  if (open && props.versionId) {
    fetchVersionDetail()
  }
})
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="sm:max-w-2xl flex flex-col p-0">
      <SheetHeader class="px-6 border-b">
        <div class="flex items-center gap-3">
          <FileCode class="h-5 w-5 text-muted-foreground" />
          <div class="flex-1">
            <SheetTitle class="flex items-center gap-2">
              <span v-if="versionDetail" class="font-mono">
                v{{ versionDetail.version }}
              </span>
              <span v-else>版本详情</span>

              <Badge
                v-if="isCurrent"
                variant="outline"
                class="text-xs bg-primary/10 text-primary border-primary/30"
              >
                <CheckCircle2 class="h-3 w-3 mr-1" />
                当前版本
              </Badge>
            </SheetTitle>
            <SheetDescription v-if="versionDetail?.summary">
              {{ versionDetail.summary }}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div
        v-if="isLoading"
        class="flex-1 flex items-center justify-center"
      >
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <div
        v-else-if="loadError"
        class="flex-1 flex items-center justify-center text-destructive"
      >
        {{ loadError }}
      </div>

      <ScrollArea v-else-if="versionDetail" class="h-[calc(100dvh-9.875rem)]">
        <div class="p-6 space-y-6">
          <div class="flex items-center gap-4">
            <Badge
              variant="outline"
              :class="cn('px-2 py-1', versionStatusColors[versionDetail.status])"
            >
              {{ versionStatusLabels[versionDetail.status] }}
            </Badge>

            <div class="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock class="h-3 w-3" />
              创建于 {{ createdTimeFormatted }}
            </div>

            <div
              v-if="publishedTimeFormatted"
              class="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Rocket class="h-3 w-3" />
              发布于 {{ publishedTimeFormatted }}
            </div>
          </div>

          <div v-if="versionDetail.changes?.length" class="space-y-2">
            <h4 class="text-sm font-medium flex items-center gap-2">
              <Tag class="h-4 w-4" />
              变更类型
            </h4>
            <div class="flex flex-wrap gap-1">
              <Badge
                v-for="change in versionDetail.changes"
                :key="change"
                variant="outline"
                :class="cn('text-xs', versionChangeTypeColors[change])"
              >
                {{ versionChangeTypeLabels[change] }}
              </Badge>
            </div>
          </div>

          <div v-if="versionDetail.changelog" class="space-y-2">
            <h4 class="text-sm font-medium">
              变更日志
            </h4>
            <p class="text-sm text-muted-foreground whitespace-pre-wrap">
              {{ versionDetail.changelog }}
            </p>
          </div>

          <Separator />

          <div class="space-y-4">
            <h4 class="text-sm font-medium">
              API 快照
            </h4>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">名称:</span>
                <span class="ml-2 font-medium">{{ versionDetail.name }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">方法:</span>
                <Badge
                  variant="outline"
                  :class="cn('ml-2 text-xs font-bold', methodBadgeColors[versionDetail.method])"
                >
                  {{ versionDetail.method }}
                </Badge>
              </div>
              <div class="col-span-2">
                <span class="text-muted-foreground">路径:</span>
                <code class="ml-2 px-2 py-0.5 bg-muted rounded text-xs font-mono">
                  {{ versionDetail.path }}
                </code>
              </div>
            </div>

            <div v-if="versionDetail.tags?.length" class="space-y-2">
              <span class="text-sm text-muted-foreground">标签:</span>
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="tag in versionDetail.tags"
                  :key="tag"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ tag }}
                </Badge>
              </div>
            </div>

            <div v-if="versionDetail.description" class="space-y-2">
              <span class="text-sm text-muted-foreground">描述:</span>
              <p class="text-sm">
                {{ versionDetail.description }}
              </p>
            </div>
          </div>

          <Separator />

          <div class="space-y-3">
            <h4 class="text-sm font-medium">
              请求参数
            </h4>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground">路径参数:</span>
                <Badge variant="outline" class="text-xs">
                  {{ versionDetail.pathParams?.length ?? 0 }}
                </Badge>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground">查询参数:</span>
                <Badge variant="outline" class="text-xs">
                  {{ versionDetail.queryParams?.length ?? 0 }}
                </Badge>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground">请求头:</span>
                <Badge variant="outline" class="text-xs">
                  {{ versionDetail.requestHeaders?.length ?? 0 }}
                </Badge>
              </div>
            </div>
          </div>

          <div v-if="requestBodyPreview" class="space-y-2">
            <h4 class="text-sm font-medium">
              请求体
            </h4>
            <CodeBlock
              :code="requestBodyPreview"
              lang="json"
              :show-header="false"
            />
          </div>

          <div v-if="responsesPreview" class="space-y-2">
            <h4 class="text-sm font-medium">
              响应定义 ({{ versionDetail.responses?.length ?? 0 }})
            </h4>
            <CodeBlock
              :code="responsesPreview"
              lang="json"
              :show-header="false"
            />
          </div>
        </div>
      </ScrollArea>

      <div
        v-if="versionDetail"
        class="px-6 py-4 border-t bg-muted/20 flex items-center justify-end gap-2"
      >
        <Button
          v-if="canRollback"
          variant="outline"
          class="text-amber-600 border-amber-600/30 hover:bg-amber-50"
          @click="emits('rollback')"
        >
          <RotateCcw class="h-4 w-4 mr-2" />
          回滚到此版本
        </Button>

        <Button
          v-if="canArchive"
          variant="outline"
          @click="emits('archive')"
        >
          <Archive class="h-4 w-4 mr-2" />
          归档
        </Button>

        <Button
          v-if="canPublish"
          @click="emits('publish')"
        >
          <Rocket class="h-4 w-4 mr-2" />
          发布版本
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
