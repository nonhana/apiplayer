<script lang="ts" setup>
import type { ApiBrief } from '@/types/api'
import { onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import ApiSidebar from '@/components/workbench/ApiSidebar.vue'
import TabItem from '@/components/workbench/TabItem.vue'
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader.vue'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useTabStore } from '@/stores/useTabStore'

const route = useRoute()
const tabStore = useTabStore()
const apiTreeStore = useApiTreeStore()

/** 处理 API 选择 */
function handleSelectApi(api: ApiBrief) {
  // 添加到标签页
  tabStore.addTab({
    id: api.id,
    type: 'api',
    title: api.name,
    method: api.method,
    path: api.path,
  })
}

/** 监听路由变化，更新当前项目 */
watch(() => route.params, (params) => {
  const projectId = params.projectId
  if (projectId) {
    apiTreeStore.setProjectId(projectId as string)
  }
}, { immediate: true })

/** 组件卸载时重置状态 */
onUnmounted(() => {
  apiTreeStore.reset()
  tabStore.reset()
})

/** 拖的是哪个标签 */
const dragSourceIndex = ref<number | null>(null)

/** 拖到哪个标签 */
const dragTargetIndex = ref<number | null>(null)

/** 开始拖拽 */
function handleDragStart(index: number) {
  dragSourceIndex.value = index
}

/** 拖拽经过 */
function handleDragOver(index: number) {
  if (dragSourceIndex.value !== null && dragSourceIndex.value !== index) {
    dragTargetIndex.value = index
  }
}

/** 拖拽结束 */
function handleDragEnd() {
  if (dragSourceIndex.value !== null && dragTargetIndex.value !== null) {
    tabStore.moveTab(dragSourceIndex.value, dragTargetIndex.value)
  }
  dragSourceIndex.value = null
  dragTargetIndex.value = null
}
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
    <WorkbenchHeader />

    <div class="flex-1 flex overflow-hidden">
      <ApiSidebar @select-api="handleSelectApi" />

      <main class="flex-1 flex flex-col overflow-hidden min-w-0">
        <div class="h-9 border-b border-border flex items-center bg-muted/30 overflow-hidden">
          <ScrollArea orientation="horizontal" class="flex-1">
            <div class="flex items-center h-full">
              <TabItem
                v-for="(tab, index) in tabStore.tabs"
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

        <div class="flex-1 overflow-auto relative">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
