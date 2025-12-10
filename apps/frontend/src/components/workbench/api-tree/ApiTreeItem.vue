<script lang="ts" setup>
import type { ApiBrief, HttpMethod } from '@/types/api'
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
const indentStyle = computed(() => ({
  paddingLeft: `${((props.level ?? 0) + 1) * 12 + 8}px`,
}))

/** 是否选中 */
const isSelected = computed(() =>
  apiTreeStore.selectedNodeId === props.api.id
  && apiTreeStore.selectedNodeType === 'api',
)

/** HTTP 方法对应的颜色样式 */
const methodColorClass = computed(() => {
  const colors: Record<HttpMethod, string> = {
    GET: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    POST: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    PUT: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    PATCH: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    DELETE: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
    HEAD: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
    OPTIONS: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
  }
  return colors[props.api.method] ?? 'bg-muted text-muted-foreground'
})

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
        <!-- HTTP 方法标签 -->
        <Badge
          variant="outline"
          :class="cn(
            'shrink-0 h-5 px-1.5 text-[10px] font-bold border',
            methodColorClass,
          )"
        >
          {{ api.method }}
        </Badge>

        <!-- API 名称 -->
        <span class="flex-1 truncate text-sm">
          {{ api.name }}
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

    <!-- 右键菜单 -->
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
