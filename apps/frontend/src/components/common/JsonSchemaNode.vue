<script lang="ts" setup>
import type { SchemaFieldType } from '@/lib/json-schema'
import type { LocalSchemaNode } from '@/types/json-schema'
import { ChevronRight, Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
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
import { SCHEMA_FIELD_TYPES } from '@/lib/json-schema'
import { cn, generateKey } from '@/lib/utils'
import Code from './Code.vue'

const props = defineProps<{
  /** Schema 节点 */
  node: LocalSchemaNode
  /** 当前节点路径（格式：'parentId-currentId'） */
  path: string
  /** 嵌套层级 */
  depth?: number
}>()

const emits = defineEmits<{
  (e: 'addNode', value: { newNode: LocalSchemaNode, path: string }): void
  (e: 'updateNode', value: { patch: { key: string, value: unknown }, path: string }): void
  (e: 'deleteNode', value: { path: string }): void
}>()

/** 是否展开（默认展开） */
const isExpanded = ref(true)

const currentDepth = computed(() => props.depth ?? 0)

/** 当前节点的完整路径 */
const currentPath = computed(() => {
  if (!props.path)
    return props.node.id
  return `${props.path}-${props.node.id}`
})

/** 父节点路径（用于添加相邻节点） */
const parentPath = computed(() => props.path || '')

/** 是否显示空 children 提示 */
const showEmptyChildren = computed(() =>
  props.node.type === 'object'
  && (!props.node.children || props.node.children.length === 0),
)

/** 是否可以删除（根节点和数组项节点不可删除） */
const canDelete = computed(() => !props.node.isRoot && !props.node.isArrayItem)

/** 是否可以添加相邻节点（根节点和数组项节点不可添加） */
const canAddSibling = computed(() => !props.node.isRoot && !props.node.isArrayItem)

/** 是否可以添加子节点（object 类型） */
const canAddChild = computed(() => props.node.type === 'object')

/** 是否可以折叠（object 或 array 类型） */
const isCollapsible = computed(() =>
  props.node.type === 'object' || props.node.type === 'array',
)

/** 是否有子内容可以折叠 */
const hasCollapsibleContent = computed(() => {
  if (props.node.type === 'object') {
    return props.node.children && props.node.children.length > 0
  }
  if (props.node.type === 'array') {
    return !!props.node.item
  }
  return false
})

/** 生成新节点 */
function genNewNode(): LocalSchemaNode {
  return {
    id: generateKey(),
    name: '',
    type: 'string',
    required: false,
    description: '',
  }
}

/** 生成 array item 节点 */
function genArrayItemNode(): LocalSchemaNode {
  return {
    id: generateKey(),
    isArrayItem: true,
    name: 'ITEMS',
    type: 'string',
    required: false,
    description: '',
  }
}

/** 添加相邻节点（在父节点的 children 中添加） */
function addSiblingNode() {
  emits('addNode', {
    newNode: genNewNode(),
    path: parentPath.value,
  })
}

/** 添加子节点（在当前节点的 children 中添加） */
function addChildNode() {
  emits('addNode', {
    newNode: genNewNode(),
    path: currentPath.value,
  })
}

/** 删除当前节点 */
function deleteNode() {
  emits('deleteNode', { path: currentPath.value })
}

/** 更新当前节点属性 */
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
    <!-- 当前节点行 -->
    <div
      class="flex items-center gap-2 px-2 py-2 hover:bg-muted/30 transition-colors group"
      :style="{ paddingLeft: `${currentDepth * 16 + 8}px` }"
    >
      <!-- 展开/折叠指示器 -->
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

      <!-- 字段名 -->
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

      <!-- 类型 -->
      <Select
        :model-value="node.type"
        :disabled="node.isRoot"
        @update:model-value="updateNode('type', $event as SchemaFieldType)"
      >
        <SelectTrigger
          class="h-8 w-[100px] text-xs"
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

      <!-- 必填（Array Item 不显示必填选项） -->
      <div class="w-[50px] flex justify-center">
        <Checkbox
          v-if="!node.isArrayItem"
          :checked="node.required"
          :disabled="node.isRoot"
          @update:checked="updateNode('required', $event)"
        />
      </div>

      <!-- 说明 -->
      <Input
        :model-value="node.description"
        placeholder="说明"
        class="h-8 text-sm min-w-[120px]"
        @update:model-value="updateNode('description', String($event))"
      />

      <!-- 操作按钮 -->
      <div class="flex items-center gap-1 justify-end">
        <!-- 添加相邻节点 -->
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

        <!-- 添加子节点（仅 object 类型） -->
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

        <!-- 删除节点 -->
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

    <!-- 可折叠的子内容 -->
    <CollapsibleContent>
      <!-- Object 子节点（递归渲染） -->
      <template v-if="node.type === 'object'">
        <!-- 空 children 提示 -->
        <div
          v-if="showEmptyChildren"
          class="px-4 py-3 text-sm text-muted-foreground bg-muted/20"
          :style="{ paddingLeft: `${(currentDepth + 1) * 16 + 8 + 24}px` }"
        >
          当前 object 尚未包含字段，点击 + 添加
        </div>

        <JsonSchemaNode
          v-for="item in node.children"
          v-else
          :key="item.id"
          :node="item"
          :path="currentPath"
          :depth="currentDepth + 1"
          @add-node="emits('addNode', $event)"
          @update-node="emits('updateNode', $event)"
          @delete-node="emits('deleteNode', $event)"
        />
      </template>

      <!-- Array Item 节点（递归渲染） -->
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
