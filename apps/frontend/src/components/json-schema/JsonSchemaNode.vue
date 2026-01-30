<script lang="ts" setup>
import type { SchemaFieldType } from '@/lib/json-schema'
import type { LocalSchemaNode } from '@/types/json-schema'
import { ChevronRight, Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import Code from '@/components/common/Code.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { genArrayItemNode, genNewNode, SCHEMA_FIELD_TYPES } from '@/lib/json-schema'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** Schema 节点 */
  node: LocalSchemaNode
  /** 当前节点路径（格式：'parentId.currentId'） */
  path: string
  /** 嵌套层级 */
  depth?: number
  /** 是否允许删除根节点 */
  allowDelRoot?: boolean
}>()

const emits = defineEmits<{
  (e: 'addNode', value: { newNode: LocalSchemaNode, path: string }): void
  (e: 'updateNode', value: { patch: { key: string, value: unknown }, path: string }): void
  (e: 'deleteNode', value: { path: string }): void
}>()

const isExpanded = ref(true)

const currentDepth = computed(() => props.depth ?? 0)

/** 当前节点的完整路径 */
const currentPath = computed(() => {
  if (!props.path)
    return props.node.id
  return `${props.path}.${props.node.id}`
})

/** 父节点路径 */
const parentPath = computed(() => props.path || '')

const showEmptyChildren = computed(() =>
  props.node.type === 'object'
  && (!props.node.children || props.node.children.length === 0),
)

const canDelete = computed(() =>
  props.allowDelRoot
    ? !props.node.isArrayItem
    : !props.node.isRoot && !props.node.isArrayItem,
)

const canAddSibling = computed(() => !props.node.isRoot && !props.node.isArrayItem)

const canAddChild = computed(() => props.node.type === 'object')

const isCollapsible = computed(() =>
  props.node.type === 'object' || props.node.type === 'array',
)

const hasCollapsibleContent = computed(() => {
  if (props.node.type === 'object') {
    return props.node.children && props.node.children.length > 0
  }
  if (props.node.type === 'array') {
    return !!props.node.item
  }
  return false
})

function addSiblingNode() {
  emits('addNode', {
    newNode: genNewNode(),
    path: parentPath.value,
  })
}

function addChildNode() {
  emits('addNode', {
    newNode: genNewNode(),
    path: currentPath.value,
  })
}

function deleteNode() {
  emits('deleteNode', { path: currentPath.value })
}

function updateNode<K extends keyof LocalSchemaNode>(key: K, value: LocalSchemaNode[K]) {
  // 类型切换时需要进行特殊处理
  if (key === 'type') {
    const newType = value as SchemaFieldType

    const patches: Array<{ key: string, value: unknown }> = []

    patches.push(
      { key: 'item', value: undefined },
      { key: 'children', value: undefined },
    )

    if (newType === 'array') {
      patches.push({
        key: 'item',
        value: genArrayItemNode(),
      })
    }

    if (newType === 'object') {
      patches.push({
        key: 'children',
        value: [],
      })
    }

    patches.forEach((patch) => {
      emits('updateNode', {
        patch,
        path: currentPath.value,
      })
    })
  }

  emits('updateNode', {
    patch: { key, value },
    path: currentPath.value,
  })
}
</script>

<template>
  <Collapsible v-model:open="isExpanded" :disabled="!isCollapsible">
    <div
      class="flex items-center gap-2 px-2 py-2 hover:bg-muted/30 transition-colors group"
      :style="{ paddingLeft: `${currentDepth * 16 + 8}px` }"
    >
      <div class="w-4 shrink-0">
        <CollapsibleTrigger
          v-if="isCollapsible"
          as-child
        >
          <button
            class="flex items-center justify-center w-4 h-4 rounded hover:bg-muted transition-colors"
            :class="{ 'cursor-default': !hasCollapsibleContent }"
            :disabled="!hasCollapsibleContent"
          >
            <ChevronRight
              :class="cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-90',
                !hasCollapsibleContent && 'opacity-30',
              )"
            />
          </button>
        </CollapsibleTrigger>
      </div>

      <span v-if="node.isRoot" class="min-w-30 flex-1"><Code>根节点</Code></span>
      <span v-else-if="node.isArrayItem" class="min-w-30 flex-1"><Code>ITEMS</Code></span>
      <div v-else class="h-8 text-sm font-mono flex-1">
        <Input
          :model-value="node.name"
          placeholder="字段名"
          class="min-w-30"
          @update:model-value="updateNode('name', String($event))"
        />
      </div>

      <Select
        :model-value="node.type"
        @update:model-value="updateNode('type', $event as SchemaFieldType)"
      >
        <SelectTrigger
          class="h-8 w-25 text-xs"
          :class="{ 'text-violet-500 dark:text-violet-400': node.isArrayItem }"
        >
          <SelectValue>
            <span class="font-mono">
              {{ node.type }}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="t in SCHEMA_FIELD_TYPES" :key="t" :value="t">
            <span class="font-mono">
              {{ t }}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <div class="w-12.5 flex justify-center">
        <Checkbox
          v-if="!node.isArrayItem"
          :model-value="node.required"
          :disabled="node.isRoot"
          @update:model-value="updateNode('required', $event as boolean)"
        />
      </div>

      <Input
        :model-value="node.description"
        placeholder="说明"
        class="h-8 text-sm min-w-30"
        @update:model-value="updateNode('description', String($event))"
      />

      <div class="flex items-center gap-1 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :disabled="!canAddSibling"
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="addSiblingNode"
              >
                <Plus class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              添加相邻字段
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :disabled="!canAddChild"
                variant="ghost"
                size="icon"
                class="h-7 w-7 text-primary"
                @click="addChildNode"
              >
                <Plus class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              添加子字段
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :disabled="!canDelete"
                variant="ghost"
                size="icon"
                class="h-7 w-7 text-muted-foreground hover:text-destructive"
                @click="deleteNode"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              删除字段
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <CollapsibleContent>
      <template v-if="node.type === 'object'">
        <div
          v-if="showEmptyChildren"
          class="px-4 py-3 text-sm text-muted-foreground bg-muted/20"
          :style="{ paddingLeft: `${(currentDepth + 1) * 16 + 8 + 24}px` }"
        >
          当前 object 尚未包含字段，点击 + 添加
        </div>

        <template v-else>
          <JsonSchemaNode
            v-for="item in node.children"
            :key="item.id"
            :node="item"
            :path="currentPath"
            :depth="currentDepth + 1"
            @add-node="emits('addNode', $event)"
            @update-node="emits('updateNode', $event)"
            @delete-node="emits('deleteNode', $event)"
          />
        </template>
      </template>

      <template v-else-if="node.type === 'array' && node.item">
        <JsonSchemaNode
          :node="node.item"
          :path="currentPath"
          :depth="currentDepth + 1"
          @add-node="emits('addNode', $event)"
          @update-node="emits('updateNode', $event)"
          @delete-node="emits('deleteNode', $event)"
        />
      </template>
    </CollapsibleContent>
  </Collapsible>
</template>
