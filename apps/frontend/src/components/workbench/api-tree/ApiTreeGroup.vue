<script lang="ts" setup>
import type { StyleValue } from 'vue'
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import type { DropItemNormal, DropPosition } from '@/types/api-drag'
import {
  ChevronRight,
  FilePlus,
  FolderClosed,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import { computed, ref, useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { cn } from '@/lib/utils'
import { useApiDragStore } from '@/stores/useApiDragStore'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import ApiTreeItem from './ApiTreeItem.vue'

const props = defineProps<{
  group: GroupNodeWithApis
  level?: number
  parentId?: string
}>()

const emits = defineEmits<{
  (e: 'createGroup', parentId: string): void
  (e: 'createApi', groupId: string): void
  (e: 'renameGroup', group: GroupNodeWithApis): void
  (e: 'deleteGroup', group: GroupNodeWithApis): void
  (e: 'selectApi', api: ApiBrief): void
  (e: 'cloneApi', api: ApiBrief): void
  (e: 'deleteApi', api: ApiBrief): void
}>()

const apiTreeStore = useApiTreeStore()
const apiDragStore = useApiDragStore()
const dragger = useApiTreeDrag(apiDragStore, apiTreeStore)

const groupItemRef = useTemplateRef('groupItemRef')

const isDragging = ref(false)

const isDragOver = ref(false)
const dropPosition = ref<DropPosition | null>(null)

const currentLevel = computed(() => props.level ?? 0)
const indentStyle = computed<StyleValue>(() => ({
  paddingLeft: `${currentLevel.value * 12 + 8}px`,
}))

const isOpen = computed({
  get: () => apiTreeStore.isExpanded(props.group.id),
  set: (val) => {
    if (val) {
      apiTreeStore.expandGroup(props.group.id)
    }
    else {
      apiTreeStore.collapseGroup(props.group.id)
    }
  },
})

const hasChildren = computed(() =>
  props.group.children.length > 0 || props.group.apiCount > 0,
)

const isSelected = computed(() =>
  apiTreeStore.selectedNodeId === props.group.id
  && apiTreeStore.selectedNodeType === 'group',
)

function handleCreateGroup() {
  emits('createGroup', props.group.id)
}

function handleCreateApi() {
  emits('createApi', props.group.id)
}

function handleRename() {
  emits('renameGroup', props.group)
}

function handleDelete() {
  emits('deleteGroup', props.group)
}

function handleClick() {
  apiTreeStore.selectNode(props.group.id, 'group')
}

// ========== 拖拽事件处理 ==========
function handleDragStart(e: DragEvent) {
  isDragging.value = true
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.group.id)

  apiDragStore.startDrag({
    id: props.group.id,
    type: 'group',
    parentId: props.parentId,
    data: props.group,
  })
}

function handleDragEnd() {
  isDragging.value = false
  isDragOver.value = false
  dropPosition.value = null
  apiDragStore.endDrag()
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()

  // 分组只能接受分组的拖拽（如果是 API 拖拽，则只能 inside）
  // 或者当 API 拖拽到分组时，允许放进去
  e.dataTransfer!.dropEffect = 'move'

  if (groupItemRef.value) {
    const position = dragger.getDropPos(e, groupItemRef.value, 'group')
    const target: DropItemNormal = {
      id: props.group.id,
      type: 'group',
      parentId: props.parentId,
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

function handleDragLeave() {
  isDragOver.value = false
  dropPosition.value = null
}

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
  <Collapsible v-model:open="isOpen">
    <ContextMenu>
      <ContextMenuTrigger as-child>
        <CollapsibleTrigger as-child>
          <div
            ref="groupItemRef"
            :class="cn(
              'group relative flex items-center gap-1 py-1.5 pr-2 cursor-pointer transition-colors duration-150 rounded-sm',
              'hover:bg-accent/50',
              isSelected && 'bg-accent',
              isDragging && 'opacity-50',
              isDragOver && dropPosition === 'inside' && 'ring-2 ring-primary ring-inset bg-primary/10',
              isDragOver && dropPosition === 'before' && 'border-t-2 border-t-primary',
              isDragOver && dropPosition === 'after' && 'border-b-2 border-b-primary',
            )"
            :style="indentStyle"
            draggable="true"
            @click.stop="handleClick"
            @dragstart="handleDragStart"
            @dragend="handleDragEnd"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <ChevronRight
              :class="cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-90',
                !hasChildren && 'opacity-0',
              )"
            />

            <FolderOpen
              v-if="isOpen"
              class="h-4 w-4 shrink-0 text-amber-500"
            />
            <FolderClosed
              v-else
              class="h-4 w-4 shrink-0 text-amber-500"
            />

            <span class="flex-1 truncate text-sm font-medium">
              {{ group.name }}
            </span>

            <span
              v-if="group.apiCount > 0"
              class="shrink-0 text-xs text-muted-foreground tabular-nums"
            >
              {{ group.apiCount }}
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
              <DropdownMenuContent align="end" class="w-44">
                <DropdownMenuItem @click="handleCreateApi">
                  <FilePlus class="mr-2 h-4 w-4" />
                  新建接口
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleCreateGroup">
                  <FolderPlus class="mr-2 h-4 w-4" />
                  新建子分组
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="handleRename">
                  <Pencil class="mr-2 h-4 w-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-destructive focus:text-destructive"
                  @click="handleDelete"
                >
                  <Trash2 class="mr-2 h-4 w-4" />
                  删除分组
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CollapsibleTrigger>
      </ContextMenuTrigger>

      <ContextMenuContent class="w-44">
        <ContextMenuItem @click="handleCreateApi">
          <FilePlus class="mr-2 h-4 w-4" />
          新建接口
        </ContextMenuItem>
        <ContextMenuItem @click="handleCreateGroup">
          <FolderPlus class="mr-2 h-4 w-4" />
          新建子分组
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem @click="handleRename">
          <Pencil class="mr-2 h-4 w-4" />
          重命名
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          class="text-destructive focus:text-destructive"
          @click="handleDelete"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          删除分组
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>

    <CollapsibleContent>
      <!-- 子分组递归 -->
      <ApiTreeGroup
        v-for="child in group.children"
        :key="child.id"
        :group="child"
        :level="currentLevel + 1"
        :parent-id="group.id"
        @create-group="(parentId) => emits('createGroup', parentId)"
        @create-api="(groupId) => emits('createApi', groupId)"
        @rename-group="(g) => emits('renameGroup', g)"
        @delete-group="(g) => emits('deleteGroup', g)"
        @select-api="(api) => emits('selectApi', api)"
        @clone-api="(api) => emits('cloneApi', api)"
        @delete-api="(api) => emits('deleteApi', api)"
      />

      <ApiTreeItem
        v-for="api in group.apis"
        :key="api.id"
        :api="api"
        :level="currentLevel + 1"
        :group-id="group.id"
        @select="(a) => emits('selectApi', a)"
        @clone="(a) => emits('cloneApi', a)"
        @delete="(a) => emits('deleteApi', a)"
      />
    </CollapsibleContent>
  </Collapsible>
</template>
