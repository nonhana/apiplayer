<script lang="ts" setup>
import type { Tab } from '@/types/api'
import {
  Copy,
  Pin,
  PinOff,
  X,
  XCircle,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { methodColors } from '@/constants/api'
import { cn } from '@/lib/utils'
import { useTabStore } from '@/stores/useTabStore'

const props = defineProps<{
  tab: Tab
  index: number
}>()

const emit = defineEmits<{
  (e: 'dragStart', index: number): void
  (e: 'dragOver', index: number): void
  (e: 'dragEnd'): void
}>()

const tabStore = useTabStore()

/** 是否正在拖拽 */
const isDragging = ref(false)

/** 是否被拖拽经过 */
const isDragOver = ref(false)

/** 是否是当前激活的标签 */
const isActive = computed(() => props.tab.id === tabStore.activeTabId)

/** 是否有右侧标签 */
const hasRightTabs = computed(() => {
  const index = tabStore.tabs.findIndex(t => t.id === props.tab.id)
  return index < tabStore.tabs.length - 1
})

/** 是否有左侧标签 */
const hasLeftTabs = computed(() => {
  const index = tabStore.tabs.findIndex(t => t.id === props.tab.id)
  return index > 0
})

/** 是否有其他标签 */
const hasOtherTabs = computed(() => tabStore.tabs.length > 1)

/** 是否有已保存的标签 */
const hasSavedTabs = computed(() => tabStore.tabs.some(t => !t.dirty))

/** 复制路径到剪贴板 */
async function copyPath() {
  if (props.tab.path) {
    await navigator.clipboard.writeText(props.tab.path)
  }
}

function handleDragStart(e: DragEvent) {
  isDragging.value = true
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.index.toString())
  emit('dragStart', props.index)
}

function handleDragEnd() {
  isDragging.value = false
  isDragOver.value = false
  emit('dragEnd')
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  isDragOver.value = true
  emit('dragOver', props.index)
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
}

/** 阻止关闭按钮的事件冒泡 */
function handleCloseClick(e: MouseEvent) {
  e.stopPropagation()
  tabStore.removeTab(props.tab.id)
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        :class="cn(
          'group relative flex items-center gap-1.5 px-3 h-9 border-r border-border cursor-pointer transition-all duration-150 select-none',
          'hover:bg-accent/50',
          isActive
            ? 'bg-background border-b-2 border-b-primary'
            : 'bg-transparent',
          isDragging && 'opacity-50',
          isDragOver && 'bg-accent border-l-2 border-l-primary',
        )"
        draggable="true"
        @click="tabStore.setActiveTab(tab.id)"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <Pin
          v-if="tab.pinned"
          class="h-3 w-3 text-muted-foreground shrink-0"
        />

        <span
          v-if="tab.method"
          :class="cn('text-[10px] font-bold shrink-0', methodColors[tab.method])"
        >
          {{ tab.method }}
        </span>

        <span class="text-xs truncate max-w-[120px]">
          {{ tab.title }}
        </span>

        <span
          v-if="tab.dirty"
          class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
        />

        <button
          type="button"
          :class="cn(
            'h-4 w-4 shrink-0 rounded-sm flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity ml-1',
            'hover:bg-accent',
          )"
          @click="handleCloseClick"
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent class="w-56">
      <ContextMenuItem @click="tabStore.removeTab(tab.id)">
        <X class="mr-2 h-4 w-4" />
        关闭
        <ContextMenuShortcut>⌘W</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuItem
        :disabled="!hasOtherTabs"
        @click="tabStore.removeOtherTabs(tab.id)"
      >
        <XCircle class="mr-2 h-4 w-4" />
        关闭其他
      </ContextMenuItem>

      <ContextMenuItem
        :disabled="!hasRightTabs"
        @click="tabStore.removeRightTabs(tab.id)"
      >
        关闭右侧
      </ContextMenuItem>

      <ContextMenuItem
        :disabled="!hasLeftTabs"
        @click="tabStore.removeLeftTabs(tab.id)"
      >
        关闭左侧
      </ContextMenuItem>

      <ContextMenuItem
        :disabled="!hasSavedTabs"
        @click="tabStore.removeSavedTabs()"
      >
        关闭已保存
      </ContextMenuItem>

      <ContextMenuItem @click="tabStore.removeAllTabs()">
        关闭全部
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem
        v-if="tab.path"
        @click="copyPath"
      >
        <Copy class="mr-2 h-4 w-4" />
        复制路径
      </ContextMenuItem>

      <ContextMenuSeparator v-if="tab.path" />

      <ContextMenuItem @click="tabStore.togglePinTab(tab.id)">
        <PinOff v-if="tab.pinned" class="mr-2 h-4 w-4" />
        <Pin v-else class="mr-2 h-4 w-4" />
        {{ tab.pinned ? '取消固定' : '固定到左侧' }}
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
