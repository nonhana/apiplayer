<script lang="ts" setup>
import type { ParamType } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import { ChevronRight, Plus, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PARAM_TYPES, paramTypeColors } from '@/constants/api'
import { cn, generateKey } from '@/lib/utils'

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

const currentDepth = computed(() => props.depth ?? 0)

/** 当前节点的完整路径 */
const currentPath = computed(() => {
  if (!props.path)
    return props.node.id
  return `${props.path}-${props.node.id}`
})

/** 父节点路径（用于添加相邻节点） */
const parentPath = computed(() => props.path || '')

const showEmptyChildren = computed(() =>
  props.node.type === 'object'
  && (!props.node.children || props.node.children.length === 0),
)

const canDelete = computed(() => !props.node.isRoot)
const canAddSibling = computed(() => !props.node.isRoot)

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
  emits('updateNode', {
    patch: { key, value },
    path: currentPath.value,
  })
}
</script>

<template>
  <div>
    <!-- 当前节点行 -->
    <div
      class="flex items-center gap-2 px-2 py-2 hover:bg-muted/30 transition-colors group"
      :style="{ paddingLeft: `${currentDepth * 16 + 8}px` }"
    >
      <!-- 展开指示器（仅 object/array 类型） -->
      <div class="w-4 shrink-0">
        <ChevronRight
          v-if="node.type === 'object' || node.type === 'array'"
          class="h-4 w-4 text-muted-foreground"
        />
      </div>

      <!-- 字段名 -->
      <Input
        :model-value="node.name"
        :placeholder="node.isRoot ? '根节点' : '字段名'"
        :disabled="node.isRoot"
        class="h-8 text-sm font-mono flex-1 min-w-[120px]"
        @update:model-value="updateNode('name', String($event))"
      />

      <!-- 类型 -->
      <Select
        :model-value="node.type"
        @update:model-value="updateNode('type', $event as ParamType)"
      >
        <SelectTrigger class="h-8 w-[100px] text-xs">
          <SelectValue>
            <span :class="cn('font-mono', paramTypeColors[node.type])">
              {{ node.type }}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="t in PARAM_TYPES" :key="t" :value="t">
            <span :class="cn('font-mono', paramTypeColors[t])">
              {{ t }}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- 必填 -->
      <div class="w-[50px] flex justify-center">
        <Checkbox
          :checked="node.required"
          :disabled="node.isRoot"
          @update:checked="updateNode('required', $event)"
        />
      </div>

      <!-- 说明 -->
      <Input
        :model-value="node.description"
        placeholder="说明"
        class="h-8 text-sm flex-1 min-w-[120px]"
        @update:model-value="updateNode('description', String($event))"
      />

      <!-- 操作按钮 -->
      <div class="w-[80px] flex items-center gap-1 justify-end">
        <!-- 添加相邻节点 -->
        <Button
          v-if="canAddSibling"
          variant="ghost"
          size="icon"
          class="h-7 w-7 opacity-0 group-hover:opacity-100"
          title="添加相邻字段"
          @click="addSiblingNode"
        >
          <Plus class="h-4 w-4" />
        </Button>

        <!-- 添加子节点（仅 object 类型） -->
        <Button
          v-if="node.type === 'object'"
          variant="ghost"
          size="icon"
          class="h-7 w-7 opacity-0 group-hover:opacity-100 text-primary"
          title="添加子字段"
          @click="addChildNode"
        >
          <Plus class="h-4 w-4" />
        </Button>

        <!-- 删除节点 -->
        <Button
          v-if="canDelete"
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
          title="删除字段"
          @click="deleteNode"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- 子节点（递归渲染） -->
    <template v-if="node.type === 'object'">
      <!-- 空 children 提示 -->
      <div
        v-if="showEmptyChildren"
        class="px-4 py-3 text-sm text-muted-foreground bg-muted/20"
        :style="{ paddingLeft: `${(currentDepth + 1) * 16 + 8}px` }"
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
  </div>
</template>
