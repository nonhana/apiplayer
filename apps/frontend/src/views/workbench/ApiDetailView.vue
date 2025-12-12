<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ScrollArea } from '@/components/ui/scroll-area'
import ApiEditor from '@/components/workbench/api-editor/ApiEditor.vue'
import TabItem from '@/components/workbench/TabItem.vue'
import { useTabStore } from '@/stores/useTabStore'

const route = useRoute()
const tabStore = useTabStore()

const apiId = computed(() => route.params.apiId as string)

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
</script>

<template>
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

    <div class="flex-1 overflow-hidden relative">
      <!-- API 编辑器 -->
      <ApiEditor
        v-if="showApiEditor && activeTab"
        :key="apiId"
        :api-id="apiId"
      />

      <!-- 空状态（无 Tab 时显示 slot 内容） -->
      <slot v-else />
    </div>
  </main>
</template>
