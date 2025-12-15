<script lang="ts" setup>
import { useRouteParams } from '@vueuse/router'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import ApiEditor from '@/components/workbench/api-editor/ApiEditor.vue'
import ApiNotFound from '@/components/workbench/ApiNotFound.vue'
import TabItem from '@/components/workbench/TabItem.vue'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useTabStore } from '@/stores/useTabStore'

const tabStore = useTabStore()
const apiTreeStore = useApiTreeStore()
const apiId = useRouteParams<string>('apiId')
const router = useRouter()

const apiLoadingStatus = computed(() => apiTreeStore.loadingStatus)

/** 当前路由的 apiId 是否是有效的 */
const isValidApiId = ref(true)

watch([apiLoadingStatus, apiId], ([loadStatus, curApiId]) => {
  if (loadStatus !== 'end' || !curApiId)
    return
  const curAPI = apiTreeStore.getApiById(apiId.value)
  isValidApiId.value = !!curAPI
})

/** 刷新 API 树并重新检查 */
async function handleRefresh() {
  await apiTreeStore.refreshTree()
  const curAPI = apiTreeStore.getApiById(apiId.value)
  isValidApiId.value = !!curAPI
}

// 如果当前的 apiId 是无效的，那么清除激活的 tab
watch(isValidApiId, (newV) => {
  if (!newV) {
    tabStore.setActiveTab('')
    apiTreeStore.clearSelection()
  }
})

/** 拖的是哪个标签 */
const dragSourceIndex = ref<number | null>(null)

/** 拖到哪个标签的哪一侧 */
const dragTarget = ref<{ index: number, side: 'left' | 'right' } | null>(null)

/** 开始拖拽 */
function handleDragStart(index: number) {
  dragSourceIndex.value = index
}

/** 拖拽经过 */
function handleDragOver(payload: { index: number, side: 'left' | 'right' }) {
  if (dragSourceIndex.value !== null && dragSourceIndex.value !== payload.index) {
    dragTarget.value = payload
  }
}

/** 拖拽结束 */
function handleDragEnd() {
  if (dragSourceIndex.value !== null && dragTarget.value !== null) {
    const fromIndex = dragSourceIndex.value
    const { index: targetIndex, side } = dragTarget.value

    let toIndex = side === 'left' ? targetIndex : targetIndex + 1

    if (fromIndex < targetIndex) {
      // 源在目标之前，移除后目标索引左移
      // 但如果源在目标之前，移除源后索引会左移一位，需要调整
      toIndex -= 1
    }

    if (fromIndex !== toIndex) {
      tabStore.moveTab(fromIndex, toIndex)
    }
  }
  dragSourceIndex.value = null
  dragTarget.value = null
}

/** 当前激活的 Tab */
const activeTab = computed(() => tabStore.activeTab)

/** 是否显示 API 编辑器 */
const showApiEditor = computed(() =>
  activeTab.value !== null && activeTab.value.type === 'api',
)

const curTabs = computed(() => tabStore.tabs)

// 清空 tabs 后重置 API 选中状态
watch(curTabs, (newV) => {
  if (!newV.length) {
    router.push({ name: 'Workbench' })
    apiTreeStore.clearSelection()
  }
})
</script>

<template>
  <main class="flex-1 flex flex-col overflow-hidden min-w-0">
    <div class="h-9 border-b border-border flex items-center bg-muted/30 overflow-hidden">
      <ScrollArea orientation="horizontal" class="flex-1">
        <div class="flex items-center h-full">
          <TabItem
            v-for="(tab, index) in curTabs"
            :key="tab.id"
            :tab="tab"
            :index="index"
            @drag-start="handleDragStart"
            @drag-over="handleDragOver"
            @drag-end="handleDragEnd"
          />
        </div>
      </ScrollArea>
    </div>

    <div class="flex-1 overflow-hidden relative">
      <!-- API 找不到时的提示 -->
      <ApiNotFound
        v-if="!isValidApiId && apiLoadingStatus === 'end'"
        :api-id="apiId"
        @refresh="handleRefresh"
      />

      <!-- API 编辑器 -->
      <ApiEditor
        v-else-if="showApiEditor && activeTab"
        :key="apiId"
        :api-id="apiId"
      />

      <!-- 空状态（无 Tab 时显示 slot 内容） -->
      <slot v-else />
    </div>
  </main>
</template>
