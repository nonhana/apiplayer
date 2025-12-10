<script lang="ts" setup>
import type { ApiBrief, GroupNodeWithApis } from '@/types/api'
import {
  ChevronRight,
  FilePlus,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import { computed } from 'vue'
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
import { cn } from '@/lib/utils'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import ApiTreeItem from './ApiTreeItem.vue'

const props = defineProps<{
  group: GroupNodeWithApis
  level?: number
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

/** 当前层级 */
const currentLevel = computed(() => props.level ?? 0)

/** 层级缩进 */
const indentStyle = computed(() => ({
  paddingLeft: `${currentLevel.value * 12 + 8}px`,
}))

/** 是否展开 */
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

/** 是否有子内容 */
const hasChildren = computed(() =>
  props.group.children.length > 0 || props.group.apis.length > 0,
)

/** 是否选中 */
const isSelected = computed(() =>
  apiTreeStore.selectedNodeId === props.group.id
  && apiTreeStore.selectedNodeType === 'group',
)

/** 新建子分组 */
function handleCreateGroup() {
  emits('createGroup', props.group.id)
}

/** 新建 API */
function handleCreateApi() {
  emits('createApi', props.group.id)
}

/** 重命名分组 */
function handleRename() {
  emits('renameGroup', props.group)
}

/** 删除分组 */
function handleDelete() {
  emits('deleteGroup', props.group)
}

/** 点击选中 */
function handleClick() {
  apiTreeStore.selectNode(props.group.id, 'group')
}
</script>

<template>
  <Collapsible v-model:open="isOpen">
    <ContextMenu>
      <ContextMenuTrigger as-child>
        <CollapsibleTrigger as-child>
          <div
            :class="cn(
              'group flex items-center gap-1 py-1.5 pr-2 cursor-pointer transition-colors duration-150 rounded-sm',
              'hover:bg-accent/50',
              isSelected && 'bg-accent',
            )"
            :style="indentStyle"
            @click.stop="handleClick"
          >
            <!-- 展开/折叠图标 -->
            <ChevronRight
              :class="cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-90',
                !hasChildren && 'opacity-0',
              )"
            />

            <!-- 文件夹图标 -->
            <FolderOpen
              v-if="isOpen"
              class="h-4 w-4 shrink-0 text-amber-500"
            />
            <FolderOpen
              v-else
              class="h-4 w-4 shrink-0 text-amber-500/70"
            />

            <!-- 分组名称 -->
            <span class="flex-1 truncate text-sm font-medium">
              {{ group.name }}
            </span>

            <!-- API 数量角标 -->
            <span
              v-if="group.apiCount > 0"
              class="shrink-0 text-xs text-muted-foreground tabular-nums"
            >
              {{ group.apiCount }}
            </span>

            <!-- 更多操作按钮 -->
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

      <!-- 右键菜单 -->
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

    <!-- 子内容 -->
    <CollapsibleContent>
      <!-- 子分组 -->
      <ApiTreeGroup
        v-for="child in group.children"
        :key="child.id"
        :group="child"
        :level="currentLevel + 1"
        @create-group="(parentId) => emits('createGroup', parentId)"
        @create-api="(groupId) => emits('createApi', groupId)"
        @rename-group="(g) => emits('renameGroup', g)"
        @delete-group="(g) => emits('deleteGroup', g)"
        @select-api="(api) => emits('selectApi', api)"
        @clone-api="(api) => emits('cloneApi', api)"
        @delete-api="(api) => emits('deleteApi', api)"
      />

      <!-- API 列表 -->
      <ApiTreeItem
        v-for="api in group.apis"
        :key="api.id"
        :api="api"
        :level="currentLevel + 1"
        @select="(a) => emits('selectApi', a)"
        @clone="(a) => emits('cloneApi', a)"
        @delete="(a) => emits('deleteApi', a)"
      />
    </CollapsibleContent>
  </Collapsible>
</template>
