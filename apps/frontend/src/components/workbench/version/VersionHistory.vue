<script lang="ts" setup>
import type { ApiVersionBrief, ApiVersionDetail } from '@/types/version'
import { AlertCircle, GitBranch, Loader2, RefreshCw } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { versionApi } from '@/api/version'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VERSION_STATUSES, versionStatusLabels } from '@/constants/version'
import RollbackConfirmDialog from './RollbackConfirmDialog.vue'
import VersionCompareSheet from './VersionCompareSheet.vue'
import VersionDetailSheet from './VersionDetailSheet.vue'
import VersionItem from './VersionItem.vue'

const props = defineProps<{
  /** 项目 ID */
  projectId: string
  /** API ID */
  apiId: string
  /** 当前版本 ID */
  currentVersionId?: string
}>()

const emits = defineEmits<{
  /** 版本发生变化（发布/回滚后）需要刷新 API 详情 */
  (e: 'versionChanged'): void
}>()

/** 版本列表 */
const versions = ref<ApiVersionBrief[]>([])

/** 加载状态 */
const isLoading = ref(false)

/** 加载错误 */
const loadError = ref<string | null>(null)

/** 筛选的状态 */
const filterStatus = ref<string>('all')

/** 选中的版本（用于查看详情） */
const selectedVersionId = ref<string | null>(null)

/** 比较模式：选择的两个版本 */
const compareVersionIds = ref<[string | null, string | null]>([null, null])

/** 是否显示详情面板 */
const isDetailSheetOpen = ref(false)

/** 是否显示比较面板 */
const isCompareSheetOpen = ref(false)

/** 回滚确认对话框 */
const rollbackDialogOpen = ref(false)
const rollbackTargetVersion = ref<ApiVersionBrief | null>(null)

/** 筛选后的版本列表 */
const filteredVersions = computed(() => {
  if (filterStatus.value === 'all') {
    return versions.value
  }
  return versions.value.filter(v => v.status === filterStatus.value)
})

/** 当前版本 */
const currentVersion = computed(() => {
  return versions.value.find(v => v.id === props.currentVersionId)
})

/** 选中的版本详情 */
const selectedVersion = computed(() => {
  if (!selectedVersionId.value)
    return null
  return versions.value.find(v => v.id === selectedVersionId.value) ?? null
})

/** 获取版本列表 */
async function fetchVersions() {
  isLoading.value = true
  loadError.value = null

  try {
    const res = await versionApi.getVersionList(props.projectId, props.apiId)
    versions.value = res.versions
  }
  catch (err) {
    loadError.value = `获取版本列表失败: ${err}`
    console.error('Failed to fetch versions:', err)
  }
  finally {
    isLoading.value = false
  }
}

/** 查看版本详情 */
function handleViewVersion(version: ApiVersionBrief) {
  selectedVersionId.value = version.id
  isDetailSheetOpen.value = true
}

/** 选择比较版本 */
function handleCompareVersion(version: ApiVersionBrief) {
  const [first, second] = compareVersionIds.value

  if (!first) {
    compareVersionIds.value = [version.id, null]
    toast.info('已选择第一个比较版本，请再选择一个版本')
  }
  else if (!second) {
    if (first === version.id) {
      toast.warning('不能选择同一个版本进行比较')
      return
    }
    compareVersionIds.value = [first, version.id]
    isCompareSheetOpen.value = true
  }
  else {
    // 重新开始选择
    compareVersionIds.value = [version.id, null]
    toast.info('已重新选择第一个比较版本')
  }
}

/** 发布版本 */
async function handlePublishVersion(version: ApiVersionBrief) {
  try {
    await versionApi.publishVersion(props.projectId, props.apiId, version.id)
    toast.success(`版本 v${version.version} 发布成功`)
    await fetchVersions()
    emits('versionChanged')
  }
  catch (err) {
    console.error('Failed to publish version:', err)
  }
}

/** 归档版本 */
async function handleArchiveVersion(version: ApiVersionBrief) {
  try {
    await versionApi.archiveVersion(props.projectId, props.apiId, version.id)
    toast.success(`版本 v${version.version} 已归档`)
    await fetchVersions()
  }
  catch (err) {
    console.error('Failed to archive version:', err)
  }
}

/** 打开回滚确认对话框 */
function handleOpenRollbackDialog(version: ApiVersionBrief) {
  rollbackTargetVersion.value = version
  rollbackDialogOpen.value = true
}

/** 确认回滚 */
async function handleConfirmRollback() {
  if (!rollbackTargetVersion.value)
    return

  try {
    await versionApi.rollbackToVersion(
      props.projectId,
      props.apiId,
      rollbackTargetVersion.value.id,
    )
    toast.success(`已回滚到版本 v${rollbackTargetVersion.value.version}`)
    rollbackDialogOpen.value = false
    rollbackTargetVersion.value = null
    await fetchVersions()
    emits('versionChanged')
  }
  catch (err) {
    console.error('Failed to rollback version:', err)
  }
}

/** 关闭比较面板时清空选择 */
function handleCloseCompare() {
  isCompareSheetOpen.value = false
  compareVersionIds.value = [null, null]
}

/** 详情面板中获取到的完整版本数据 */
const detailVersionData = ref<ApiVersionDetail | null>(null)

/** 监听 API ID 变化，重新获取版本列表 */
watch(
  () => props.apiId,
  () => {
    if (props.apiId) {
      fetchVersions()
    }
  },
  { immediate: true },
)

defineExpose({
  refresh: fetchVersions,
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 头部工具栏 -->
    <div class="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
      <div class="flex items-center gap-2">
        <GitBranch class="h-4 w-4 text-muted-foreground" />
        <span class="font-medium text-sm">版本历史</span>
        <span class="text-xs text-muted-foreground">
          ({{ filteredVersions.length }})
        </span>
      </div>

      <div class="flex items-center gap-2">
        <!-- 状态筛选 -->
        <Select v-model="filterStatus">
          <SelectTrigger class="h-7 w-24 text-xs">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              全部
            </SelectItem>
            <SelectItem
              v-for="status in VERSION_STATUSES"
              :key="status"
              :value="status"
            >
              {{ versionStatusLabels[status] }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- 刷新按钮 -->
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          :disabled="isLoading"
          @click="fetchVersions"
        >
          <RefreshCw
            class="h-3.5 w-3.5" :class="[isLoading && 'animate-spin']"
          />
        </Button>
      </div>
    </div>

    <!-- 当前版本信息 -->
    <div
      v-if="currentVersion"
      class="px-4 py-2 border-b bg-primary/5"
    >
      <div class="flex items-center gap-2 text-xs">
        <span class="text-muted-foreground">当前版本:</span>
        <span class="font-mono font-semibold text-primary">
          v{{ currentVersion.version }}
        </span>
      </div>
    </div>

    <!-- 版本列表 -->
    <ScrollArea class="flex-1">
      <!-- 加载状态 -->
      <div
        v-if="isLoading && versions.length === 0"
        class="flex items-center justify-center py-12"
      >
        <div class="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 class="h-6 w-6 animate-spin" />
          <span class="text-sm">加载中...</span>
        </div>
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="loadError"
        class="flex items-center justify-center py-12"
      >
        <div class="flex flex-col items-center gap-3 text-destructive">
          <AlertCircle class="h-6 w-6" />
          <span class="text-sm">{{ loadError }}</span>
          <Button
            variant="outline"
            size="sm"
            @click="fetchVersions"
          >
            重试
          </Button>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="filteredVersions.length === 0"
        class="flex items-center justify-center py-12"
      >
        <div class="flex flex-col items-center gap-2 text-muted-foreground">
          <GitBranch class="h-8 w-8" />
          <span class="text-sm">暂无版本记录</span>
        </div>
      </div>

      <!-- 版本列表 -->
      <div v-else class="p-4 space-y-2">
        <VersionItem
          v-for="version in filteredVersions"
          :key="version.id"
          :version="version"
          :is-selected="selectedVersionId === version.id"
          :is-current="version.id === currentVersionId"
          :show-compare="true"
          @view="handleViewVersion(version)"
          @compare="handleCompareVersion(version)"
          @publish="handlePublishVersion(version)"
          @archive="handleArchiveVersion(version)"
          @rollback="handleOpenRollbackDialog(version)"
        />
      </div>
    </ScrollArea>

    <!-- 版本详情面板 -->
    <VersionDetailSheet
      v-model:open="isDetailSheetOpen"
      :project-id="projectId"
      :api-id="apiId"
      :version-id="selectedVersionId"
      :is-current="selectedVersionId === currentVersionId"
      @update:version-data="detailVersionData = $event"
      @publish="handlePublishVersion(selectedVersion!)"
      @archive="handleArchiveVersion(selectedVersion!)"
      @rollback="handleOpenRollbackDialog(selectedVersion!)"
    />

    <!-- 版本比较面板 -->
    <VersionCompareSheet
      v-model:open="isCompareSheetOpen"
      :project-id="projectId"
      :api-id="apiId"
      :from-version-id="compareVersionIds[0]"
      :to-version-id="compareVersionIds[1]"
      @close="handleCloseCompare"
    />

    <!-- 回滚确认对话框 -->
    <RollbackConfirmDialog
      v-model:open="rollbackDialogOpen"
      :version="rollbackTargetVersion"
      @confirm="handleConfirmRollback"
    />
  </div>
</template>
