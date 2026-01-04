<script lang="ts" setup>
import type { ApiVersionBrief } from '@/types/version'
import { GitBranch, History, Loader2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { versionApi } from '@/api/version'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { versionStatusDotColors, versionStatusLabels } from '@/constants/version'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** 项目 ID */
  projectId: string
  /** API ID */
  apiId: string
  /** 当前版本 ID */
  currentVersionId?: string
}>()

const emits = defineEmits<{
  (e: 'openHistory'): void
}>()

/** 最近版本列表 */
const recentVersions = ref<ApiVersionBrief[]>([])

/** 加载状态 */
const isLoading = ref(false)

/** 总版本数 */
const totalCount = ref(0)

/** 当前版本 */
const currentVersion = computed(() => recentVersions.value.find(v => v.id === props.currentVersionId))

/** 获取最近版本 */
async function fetchRecentVersions() {
  isLoading.value = true
  try {
    const res = await versionApi.getVersionList(props.projectId, props.apiId)
    totalCount.value = res.versions.length
    recentVersions.value = res.versions.slice(0, 3)
  }
  catch (err) {
    console.error('Failed to fetch recent versions:', err)
  }
  finally {
    isLoading.value = false
  }
}

/** 格式化相对时间 */
const formatRelativeTime = (dateStr: string) => dayjs(dateStr).fromNow()

/** 监听 API ID 变化 */
watch(
  () => props.apiId,
  () => {
    if (props.apiId) {
      fetchRecentVersions()
    }
  },
  { immediate: true },
)

defineExpose({
  refresh: fetchRecentVersions,
})
</script>

<template>
  <div class="rounded-lg border bg-card">
    <div class="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
      <h3 class="text-sm font-semibold flex items-center gap-2">
        <GitBranch class="h-4 w-4" />
        版本历史
      </h3>
      <Badge v-if="totalCount > 0" variant="secondary" class="text-xs">
        {{ totalCount }}
      </Badge>
    </div>

    <div class="p-4">
      <!-- 加载状态 -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-4"
      >
        <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
      </div>

      <!-- 版本列表 -->
      <template v-else-if="recentVersions.length > 0">
        <!-- 当前版本 -->
        <div
          v-if="currentVersion"
          class="mb-3 p-2 rounded-md bg-primary/5 border border-primary/20"
        >
          <div class="flex items-center gap-2 text-xs">
            <span class="text-muted-foreground">当前:</span>
            <span class="font-mono font-semibold text-primary">
              v{{ currentVersion.version }}
            </span>
          </div>
        </div>

        <!-- 最近版本 -->
        <div class="space-y-2">
          <div
            v-for="version in recentVersions"
            :key="version.id"
            class="flex items-center gap-2 text-sm"
          >
            <div
              :class="cn(
                'h-2 w-2 rounded-full shrink-0',
                versionStatusDotColors[version.status],
              )"
            />
            <span class="font-mono text-xs">v{{ version.version }}</span>
            <span class="text-xs text-muted-foreground">
              {{ versionStatusLabels[version.status] }}
            </span>
            <span class="flex-1" />
            <span class="text-xs text-muted-foreground">
              {{ formatRelativeTime(version.createdAt) }}
            </span>
          </div>
        </div>

        <Separator class="my-3" />

        <!-- 查看全部按钮 -->
        <Button
          variant="outline"
          size="sm"
          class="w-full"
          @click="emits('openHistory')"
        >
          <History class="h-3.5 w-3.5 mr-2" />
          查看全部版本
        </Button>
      </template>

      <!-- 空状态 -->
      <div
        v-else
        class="text-center py-4 text-sm text-muted-foreground"
      >
        <GitBranch class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>暂无版本记录</p>
      </div>
    </div>
  </div>
</template>
