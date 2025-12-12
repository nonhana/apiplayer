<script lang="ts" setup>
import type { StyleValue } from 'vue'
import type { ApiBrief } from '@/types/api'
import type { DropItemNormal, DropPosition } from '@/types/api-drag'
import { Copy, MoreHorizontal, Trash2 } from 'lucide-vue-next'
import { computed, ref, useTemplateRef } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useApiTreeDrag } from '@/composables/useApiTreeDrag'
import { methodBadgeColors } from '@/constants/api'
import { cn } from '@/lib/utils'
import { useApiDragStore } from '@/stores/useApiDragStore'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  api: ApiBrief
  level?: number
  groupId: string
}>()

const emits = defineEmits<{
  (e: 'select', api: ApiBrief): void
  (e: 'clone', api: ApiBrief): void
  (e: 'delete', api: ApiBrief): void
}>()

const apiTreeStore = useApiTreeStore()
const apiDragStore = useApiDragStore()
const dragger = useApiTreeDrag(apiDragStore, apiTreeStore)

/** API 行元素引用 */
const apiRowRef = useTemplateRef('apiRowRef')

/** 是否正在拖拽当前项 */
const isDragging = ref(false)

/** 是否是拖拽目标 */
const isDragOver = ref(false)

/** 拖拽目标位置 */
const dropPosition = ref<DropPosition | null>(null)

/** 层级缩进 */
const indentStyle = computed<StyleValue>(() => ({
  paddingLeft: `${((props.level ?? 0) + 1) * 12 + 8}px`,
}))

/** 是否选中 */
const isSelected = computed(() =>
  apiTreeStore.selectedNodeId === props.api.id
  && apiTreeStore.selectedNodeType === 'api',
)

/** 点击选中 */
function handleClick() {
  apiTreeStore.selectNode(props.api.id, 'api')
  emits('select', props.api)
}

/** 克隆 API */
function handleClone() {
  emits('clone', props.api)
}

/** 删除 API */
function handleDelete() {
  emits('delete', props.api)
}

// ========== 拖拽事件处理 ==========

/** 开始拖拽 */
function handleDragStart(e: DragEvent) {
  isDragging.value = true
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.api.id)

  apiDragStore.startDrag({
    id: props.api.id,
    type: 'api',
    parentId: props.groupId,
    data: props.api,
  })
}

/** 拖拽结束 */
function handleDragEnd() {
  isDragging.value = false
  isDragOver.value = false
  dropPosition.value = null
  apiDragStore.endDrag()
}

/** 拖拽经过 */
function handleDragOver(e: DragEvent) {
  e.preventDefault()

  e.dataTransfer!.dropEffect = 'move'

  if (apiRowRef.value) {
    const position = dragger.getDropPos(e, apiRowRef.value, 'api')
    const target: DropItemNormal = {
      id: props.api.id,
      type: 'api',
      parentId: props.groupId,
      position,
    }

    if (dragger.isValidDrop(target)) {
      isDragOver.value = true
      dropPosition.value = position
      apiDragStore.setDropTarget(target)
    }
    else {
      isDragOver.value = false
      dropPosition.value = null
      apiDragStore.setDropTarget(null)
    }
  }
}

/** 拖拽离开 */
function handleDragLeave() {
  isDragOver.value = false
  dropPosition.value = null
}

/** 放置 */
async function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (isDragOver.value) {
    await dragger.executeDrop()
  }

  isDragOver.value = false
  dropPosition.value = null
}
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        ref="apiRowRef"
        :class="cn(
          'group relative flex items-center gap-2 py-1.5 pr-2 cursor-pointer transition-colors duration-150 rounded-sm',
          'hover:bg-accent/50',
          isSelected && 'bg-accent',
          isDragging && 'opacity-50',
          isDragOver && dropPosition === 'before' && 'border-t-2 border-t-primary',
          isDragOver && dropPosition === 'after' && 'border-b-2 border-b-primary',
        )"
        :style="indentStyle"
        draggable="true"
        @click="handleClick"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <Badge
          variant="outline"
          :class="cn(
            'shrink-0 h-5 px-1.5 text-[10px] font-bold border',
            methodBadgeColors[api.method],
          )"
        >
          {{ api.method }}
        </Badge>

        <span class="flex-1 truncate text-sm">
          {{ api.name }}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop
            >
              <MoreHorizontal class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuItem @click="handleClone">
              <Copy class="mr-2 h-4 w-4" />
              克隆
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-destructive focus:text-destructive"
              @click="handleDelete"
            >
              <Trash2 class="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent class="w-40">
      <ContextMenuItem @click="handleClone">
        <Copy class="mr-2 h-4 w-4" />
        克隆
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        class="text-destructive focus:text-destructive"
        @click="handleDelete"
      >
        <Trash2 class="mr-2 h-4 w-4" />
        删除
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>
