<script lang="ts" setup>
import type { ApiVersionBrief, ApiVersionDetail } from '@/types/version'
import { AlertCircle, GitBranch, Loader2, RefreshCw } from 'lucide-vue-next'
import { computed, ref, watch, watchEffect } from 'vue'
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
import RollbackConfirmDialog from '../dialogs/RollbackConfirmDialog.vue'
import VersionCompareSheet from './VersionCompareSheet.vue'
import VersionDetailSheet from './VersionDetailSheet.vue'
import VersionItem from './VersionItem.vue'

const props = defineProps<{
  projectId: string
  apiId: string
  currentVersionId?: string
}>()

const emits = defineEmits<{
  (e: 'versionChanged'): void
}>()

const VERSION_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '草稿', value: 'DRAFT' },
  { label: '当前版本', value: 'CURRENT' },
  { label: '已归档', value: 'ARCHIVED' },
] as const
type VersionOptionValue = (typeof VERSION_OPTIONS)[number]['value']

const versions = ref<ApiVersionBrief[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const filterStatus = ref<VersionOptionValue>('ALL')
const selectedVersionId = ref<string | null>(null)

const compareVersionIds = ref<[string | null, string | null]>([null, null])

const isDetailSheetOpen = ref(false)
const isCompareSheetOpen = ref(false)
const rollbackDialogOpen = ref(false)

const rollbackTargetVersion = ref<ApiVersionBrief | null>(null)

const filteredVersions = computed(() => {
  if (filterStatus.value === 'ALL') {
    return versions.value
  }
  return versions.value.filter(v => v.status === filterStatus.value)
})

const currentVersion = computed(() => versions.value.find(v => v.id === props.currentVersionId))

const selectedVersion = computed(() => {
  if (!selectedVersionId.value)
    return null
  return versions.value.find(v => v.id === selectedVersionId.value) ?? null
})

async function fetchVersions() {
  isLoading.value = true
  loadError.value = null

  try {
    const res = await versionApi.getVersionList(props.projectId, props.apiId)
    versions.value = res.versions
  }
  catch (error) {
    loadError.value = `获取版本列表失败: ${error}`
    console.error('Failed to fetch versions:', error)
  }
  finally {
    isLoading.value = false
  }
}

function handleViewVersion(version: ApiVersionBrief) {
  selectedVersionId.value = version.id
  isDetailSheetOpen.value = true
}

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

async function handlePublishVersion(version: ApiVersionBrief) {
  try {
    await versionApi.publishVersion(props.projectId, props.apiId, version.id)
    toast.success(`版本 v${version.version} 发布成功`)
    await fetchVersions()
    emits('versionChanged')
  }
  catch (error) {
    console.error('Failed to publish version:', error)
  }
}

async function handleArchiveVersion(version: ApiVersionBrief) {
  try {
    await versionApi.archiveVersion(props.projectId, props.apiId, version.id)
    toast.success(`版本 v${version.version} 已归档`)
    await fetchVersions()
  }
  catch (error) {
    console.error('Failed to archive version:', error)
  }
}

function handleOpenRollbackDialog(version: ApiVersionBrief) {
  rollbackTargetVersion.value = version
  rollbackDialogOpen.value = true
}

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
  catch (error) {
    console.error('Failed to rollback version:', error)
  }
}

function handleCloseCompare() {
  isCompareSheetOpen.value = false
}

watchEffect(() => !isCompareSheetOpen.value && (compareVersionIds.value = [null, null]))

const detailVersionData = ref<ApiVersionDetail | null>(null)

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
    <div class="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
      <div class="flex items-center gap-2">
        <GitBranch class="h-4 w-4 text-muted-foreground" />
        <span class="font-medium text-sm">版本历史</span>
        <span class="text-xs text-muted-foreground">
          ({{ filteredVersions.length }})
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Select v-model="filterStatus">
          <SelectTrigger class="h-7 w-24 text-xs">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in VERSION_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7"
          :disabled="isLoading"
          @click="fetchVersions"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="[isLoading && 'animate-spin']" />
        </Button>
      </div>
    </div>

    <div
      v-if="currentVersion"
      class="px-4 py-2 border-b bg-primary/5"
    >
      <div class="flex items-center gap-2 text-xs">
        <span class="text-muted-foreground">当前版本:</span>
        <span class="font-mono font-semibold text-primary">
          {{ currentVersion.version }}
        </span>
      </div>
    </div>

    <ScrollArea class="flex-1">
      <div
        v-if="isLoading && versions.length === 0"
        class="flex items-center justify-center py-12"
      >
        <div class="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 class="h-6 w-6 animate-spin" />
          <span class="text-sm">加载中...</span>
        </div>
      </div>

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

      <div
        v-else-if="filteredVersions.length === 0"
        class="flex items-center justify-center py-12"
      >
        <div class="flex flex-col items-center gap-2 text-muted-foreground">
          <GitBranch class="h-8 w-8" />
          <span class="text-sm">暂无版本记录</span>
        </div>
      </div>

      <div v-else class="p-4 space-y-2">
        <VersionItem
          v-for="version in filteredVersions"
          :key="version.id"
          :version="version"
          :is-selected="selectedVersionId === version.id"
          :is-current="version.id === currentVersionId"
          :show-compare="true"
          :is-comparing="compareVersionIds.includes(version.id)"
          @view="handleViewVersion(version)"
          @compare="handleCompareVersion(version)"
          @publish="handlePublishVersion(version)"
          @archive="handleArchiveVersion(version)"
          @rollback="handleOpenRollbackDialog(version)"
        />
      </div>
    </ScrollArea>

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

    <VersionCompareSheet
      v-model:open="isCompareSheetOpen"
      :project-id="projectId"
      :api-id="apiId"
      :from-version-id="compareVersionIds[0]"
      :to-version-id="compareVersionIds[1]"
      @close="handleCloseCompare"
    />

    <RollbackConfirmDialog
      v-model:open="rollbackDialogOpen"
      :version="rollbackTargetVersion"
      @confirm="handleConfirmRollback"
    />
  </div>
</template>
