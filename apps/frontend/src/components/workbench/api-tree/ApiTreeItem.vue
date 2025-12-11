<script lang="ts" setup>
import type { StyleValue } from 'vue'
import type { ApiBrief } from '@/types/api'
import { Copy, MoreHorizontal, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'
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
import { methodBadgeColors } from '@/constants/api'
import { cn } from '@/lib/utils'
import { useApiTreeStore } from '@/stores/useApiTreeStore'

const props = defineProps<{
  api: ApiBrief
  level?: number
}>()

const emits = defineEmits<{
  (e: 'select', api: ApiBrief): void
  (e: 'clone', api: ApiBrief): void
  (e: 'delete', api: ApiBrief): void
}>()

const apiTreeStore = useApiTreeStore()

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
</script>

<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <div
        :class="cn(
          'group flex items-center gap-2 py-1.5 pr-2 cursor-pointer transition-colors duration-150 rounded-sm',
          'hover:bg-accent/50',
          isSelected && 'bg-accent',
        )"
        :style="indentStyle"
        @click="handleClick"
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
