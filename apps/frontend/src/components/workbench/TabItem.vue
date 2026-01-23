<script lang="ts" setup>
import type { Tab } from '@/types/api'
import { useRouteParams } from '@vueuse/router'
import {
  Copy,
  Pin,
  PinOff,
  X,
  XCircle,
} from 'lucide-vue-next'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import { useTabStore } from '@/stores/useTabStore'

/** 插入方向 */
type DropSide = 'left' | 'right'

const props = defineProps<{
  tab: Tab
  index: number
}>()

const emit = defineEmits<{
  (e: 'dragStart', index: number): void
  (e: 'dragOver', payload: { index: number, side: DropSide }): void
  (e: 'dragEnd'): void
}>()

const tabStore = useTabStore()
const apiEditorStore = useApiEditorStore()
const apiId = useRouteParams<string>('apiId')
const router = useRouter()

const tabRef = useTemplateRef('tabRef')

const isDragging = ref(false)
const isDragOver = ref(false)
const dragOverSide = ref<DropSide | null>(null)

const isActive = computed(() => props.tab.id === tabStore.activeTabId)

const isDirty = computed(() => {
  if (props.tab.type === 'api') {
    return apiEditorStore.hasUnsavedChanges(props.tab.id)
  }
  return false
})

const hasRightTabs = computed(() => {
  const index = tabStore.tabs.findIndex(t => t.id === props.tab.id)
  return index < tabStore.tabs.length - 1
})

const hasLeftTabs = computed(() => {
  const index = tabStore.tabs.findIndex(t => t.id === props.tab.id)
  return index > 0
})

const hasOtherTabs = computed(() => tabStore.tabs.length > 1)

const hasSavedTabs = computed(() =>
  tabStore.tabs.some((t) => {
    if (t.type === 'api') {
      return !apiEditorStore.hasUnsavedChanges(t.id)
    }
    return true // 非 API 类型 Tab 视为已保存
  }),
)

async function copyPath() {
  if (props.tab.path) {
    await navigator.clipboard.writeText(props.tab.path)
  }
}

function handleClick() {
  if (!apiId.value) {
    router.push({ name: 'ApiDetail', params: { apiId: props.tab.id } })
  }
  else {
    apiId.value = props.tab.id
  }
}

// 当 route 上的 apiId 变化时，若等于当前 api.id，则自动触发选中
watch(apiId, (newV) => {
  if (newV === props.tab.id) {
    tabStore.setActiveTab(props.tab.id)
  }
}, { immediate: true })

function handleDragStart(e: DragEvent) {
  isDragging.value = true
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.index.toString())
  emit('dragStart', props.index)
}

function handleDragEnd() {
  isDragging.value = false
  isDragOver.value = false
  dragOverSide.value = null
  emit('dragEnd')
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'

  // 计算鼠标在当前 Tab 上的相对位置，判断偏左还是偏右
  if (tabRef.value) {
    const rect = tabRef.value.getBoundingClientRect()
    const mouseX = e.clientX
    const tabCenterX = rect.left + rect.width / 2

    const side: DropSide = mouseX < tabCenterX ? 'left' : 'right'
    dragOverSide.value = side
    isDragOver.value = true
    emit('dragOver', { index: props.index, side })
  }
}

function handleDragLeave() {
  isDragOver.value = false
  dragOverSide.value = null
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  dragOverSide.value = null
}

function handleCloseClick(e: MouseEvent) {
  e.stopPropagation()
  tabStore.removeTab(props.tab.id)
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        ref="tabRef"
        :class="cn(
          'group relative flex items-center gap-1.5 px-3 h-9 border-r border-border cursor-pointer transition-colors duration-100 select-none',
          'hover:bg-accent/50',
          isActive
            ? 'bg-background border-b-2 border-b-primary'
            : 'bg-transparent',
          isDragging && 'opacity-50',
          isDragOver && dragOverSide === 'left' && 'border-l-2 border-l-primary',
          isDragOver && dragOverSide === 'right' && 'border-r-2 border-r-primary',
        )"
        draggable="true"
        @click="handleClick"
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

        <span class="text-xs truncate max-w-30">
          {{ tab.title }}
        </span>

        <span
          v-if="isDirty"
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
