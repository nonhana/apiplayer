<script lang="ts" setup>
import type { ParamType } from '@/types/api'
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PARAM_TYPES } from '@/constants/api'
import { cn } from '@/lib/utils'

/** Schema 节点类型 */
interface SchemaNode {
  _key: string
  name: string
  type: ParamType
  required: boolean
  description: string
  example?: string
  /** 子节点（object 类型） */
  children?: SchemaNode[]
  /** 数组项类型（array 类型） */
  items?: SchemaNode
}

const props = withDefaults(defineProps<{
  /** JSON Schema 数据 */
  schema: Record<string, unknown> | null
  /** 是否禁用 */
  disabled?: boolean
  /** 最大深度 */
  maxDepth?: number
}>(), {
  disabled: false,
  maxDepth: 5,
})

const emit = defineEmits<{
  (e: 'update:schema', schema: Record<string, unknown> | null): void
}>()

/** 生成唯一 key */
function generateKey() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** 根节点列表 */
const rootNodes = ref<SchemaNode[]>([])

/** 展开状态 */
const expandedKeys = ref<Set<string>>(new Set())

/** 类型颜色 */
const typeColors: Record<ParamType, string> = {
  string: 'text-emerald-600',
  number: 'text-blue-600',
  integer: 'text-blue-600',
  boolean: 'text-purple-600',
  array: 'text-amber-600',
  object: 'text-rose-600',
  file: 'text-cyan-600',
}

/** 将 JSON Schema 转换为节点树 */
function schemaToNodes(schema: Record<string, unknown> | null): SchemaNode[] {
  if (!schema || typeof schema !== 'object')
    return []

  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>
  const required = (schema.required ?? []) as string[]

  return Object.entries(properties).map(([name, prop]) => {
    const type = (prop.type as ParamType) || 'string'
    const node: SchemaNode = {
      _key: generateKey(),
      name,
      type,
      required: required.includes(name),
      description: (prop.description as string) || '',
      example: prop.example !== undefined ? String(prop.example) : undefined,
    }

    if (type === 'object' && prop.properties) {
      node.children = schemaToNodes(prop as Record<string, unknown>)
      expandedKeys.value.add(node._key)
    }

    if (type === 'array' && prop.items) {
      const items = prop.items as Record<string, unknown>
      const itemType = (items.type as ParamType) || 'string'
      node.items = {
        _key: generateKey(),
        name: 'items',
        type: itemType,
        required: false,
        description: '',
      }
      if (itemType === 'object' && items.properties) {
        node.items.children = schemaToNodes(items as Record<string, unknown>)
      }
      expandedKeys.value.add(node._key)
    }

    return node
  })
}

/** 将节点树转换回 JSON Schema */
function nodesToSchema(nodes: SchemaNode[]): Record<string, unknown> {
  if (nodes.length === 0) {
    return { type: 'object', properties: {} }
  }

  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const node of nodes) {
    if (!node.name.trim())
      continue

    const prop: Record<string, unknown> = {
      type: node.type,
    }

    if (node.description) {
      prop.description = node.description
    }

    if (node.example !== undefined && node.example !== '') {
      prop.example = node.example
    }

    if (node.type === 'object' && node.children) {
      const childSchema = nodesToSchema(node.children)
      prop.properties = childSchema.properties
      if (Array.isArray(childSchema.required) && childSchema.required.length > 0) {
        prop.required = childSchema.required
      }
    }

    if (node.type === 'array' && node.items) {
      if (node.items.type === 'object' && node.items.children) {
        const itemSchema = nodesToSchema(node.items.children)
        prop.items = {
          type: 'object',
          properties: itemSchema.properties,
          ...(Array.isArray(itemSchema.required) && itemSchema.required.length > 0
            ? { required: itemSchema.required }
            : {}),
        }
      }
      else {
        prop.items = { type: node.items.type }
      }
    }

    properties[node.name] = prop

    if (node.required) {
      required.push(node.name)
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  }
}

/** 同步外部数据 */
watch(
  () => props.schema,
  (newSchema) => {
    rootNodes.value = schemaToNodes(newSchema)
  },
  { immediate: true, deep: true },
)

/** 通知变化 */
function emitChange() {
  const schema = nodesToSchema(rootNodes.value)
  emit('update:schema', schema)
}

/** 切换展开 */
function toggleExpand(key: string) {
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key)
  }
  else {
    expandedKeys.value.add(key)
  }
}

/** 判断是否展开 */
function isExpanded(key: string): boolean {
  return expandedKeys.value.has(key)
}

/** 添加根节点 */
function addRootNode() {
  if (props.disabled)
    return

  const newNode: SchemaNode = {
    _key: generateKey(),
    name: '',
    type: 'string',
    required: false,
    description: '',
  }
  rootNodes.value.push(newNode)
  emitChange()
}

/** 添加子节点 */
function addChildNode(parent: SchemaNode) {
  if (props.disabled)
    return

  if (!parent.children) {
    parent.children = []
  }

  parent.children.push({
    _key: generateKey(),
    name: '',
    type: 'string',
    required: false,
    description: '',
  })

  expandedKeys.value.add(parent._key)
  emitChange()
}

/** 删除节点 */
function removeNode(nodes: SchemaNode[], index: number) {
  if (props.disabled)
    return

  nodes.splice(index, 1)
  emitChange()
}

/** 更新节点 */
function updateNode<K extends keyof SchemaNode>(node: SchemaNode, key: K, value: SchemaNode[K]) {
  if (props.disabled)
    return

  node[key] = value

  // 类型切换时初始化子结构
  if (key === 'type') {
    if (value === 'object') {
      node.children = node.children ?? []
    }
    else if (value === 'array') {
      node.items = node.items ?? {
        _key: generateKey(),
        name: 'items',
        type: 'string',
        required: false,
        description: '',
      }
    }
  }

  emitChange()
}

/** 判断节点是否可展开（有子节点） */
function isExpandable(node: SchemaNode): boolean {
  return (node.type === 'object' && !!node.children)
    || (node.type === 'array' && node.items?.type === 'object' && !!node.items.children)
}

/** 获取可展开的子节点列表 */
function getExpandableChildren(node: SchemaNode): SchemaNode[] {
  if (node.type === 'object' && node.children) {
    return node.children
  }
  if (node.type === 'array' && node.items?.type === 'object' && node.items.children) {
    return node.items.children
  }
  return []
}

/** 是否有节点 */
const hasNodes = computed(() => rootNodes.value.length > 0)
</script>

<template>
  <div class="space-y-2">
    <!-- 表头 -->
    <div
      class="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 rounded-t-md border border-b-0"
    >
      <div class="w-6" />
      <div class="flex-1 min-w-[120px]">
        字段名
      </div>
      <div class="w-[100px]">
        类型
      </div>
      <div class="w-[50px] text-center">
        必填
      </div>
      <div class="flex-1 min-w-[120px]">
        说明
      </div>
      <div class="w-[80px]" />
    </div>

    <!-- 节点列表 -->
    <div class="border rounded-b-md divide-y">
      <template v-if="hasNodes">
        <template v-for="(node, index) in rootNodes" :key="node._key">
          <!-- 根节点行 -->
          <div
            class="flex items-center gap-2 px-2 py-2 hover:bg-muted/30 transition-colors group"
          >
            <!-- 展开/折叠 -->
            <div class="w-6 flex justify-center">
              <button
                v-if="isExpandable(node)"
                class="p-0.5 hover:bg-muted rounded"
                @click="toggleExpand(node._key)"
              >
                <ChevronDown
                  v-if="isExpanded(node._key)"
                  class="h-4 w-4 text-muted-foreground"
                />
                <ChevronRight v-else class="h-4 w-4 text-muted-foreground" />
              </button>
              <GripVertical
                v-else
                class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-50"
              />
            </div>

            <!-- 字段名 -->
            <Input
              :model-value="node.name"
              placeholder="字段名"
              :disabled="disabled"
              class="h-8 text-sm font-mono flex-1 min-w-[120px]"
              @update:model-value="updateNode(node, 'name', String($event))"
            />

            <!-- 类型 -->
            <Select
              :model-value="node.type"
              :disabled="disabled"
              @update:model-value="updateNode(node, 'type', $event as ParamType)"
            >
              <SelectTrigger class="h-8 w-[100px] text-xs">
                <SelectValue>
                  <span :class="cn('font-mono', typeColors[node.type])">
                    {{ node.type }}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in PARAM_TYPES" :key="t" :value="t">
                  <span :class="cn('font-mono', typeColors[t])">
                    {{ t }}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- 必填 -->
            <div class="w-[50px] flex justify-center">
              <Checkbox
                :checked="node.required"
                :disabled="disabled"
                @update:checked="updateNode(node, 'required', $event)"
              />
            </div>

            <!-- 说明 -->
            <Input
              :model-value="node.description"
              placeholder="说明"
              :disabled="disabled"
              class="h-8 text-sm flex-1 min-w-[120px]"
              @update:model-value="updateNode(node, 'description', String($event))"
            />

            <!-- 操作 -->
            <div class="w-[80px] flex items-center gap-1 justify-end">
              <Button
                v-if="node.type === 'object'"
                variant="ghost"
                size="icon"
                :disabled="disabled"
                class="h-7 w-7 opacity-0 group-hover:opacity-100"
                title="添加子字段"
                @click="addChildNode(node)"
              >
                <Plus class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                :disabled="disabled"
                class="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                @click="removeNode(rootNodes, index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- 子节点（递归渲染） -->
          <Collapsible v-if="isExpandable(node)" :open="isExpanded(node._key)">
            <CollapsibleContent>
              <div class="pl-8 border-l-2 border-muted ml-4 space-y-0 divide-y">
                <template
                  v-for="(child, childIndex) in getExpandableChildren(node)"
                  :key="child._key"
                >
                  <div
                    class="flex items-center gap-2 px-2 py-2 hover:bg-muted/30 transition-colors group"
                  >
                    <!-- 展开/折叠（嵌套对象） -->
                    <div class="w-6 flex justify-center">
                      <button
                        v-if="isExpandable(child)"
                        class="p-0.5 hover:bg-muted rounded"
                        @click="toggleExpand(child._key)"
                      >
                        <ChevronDown
                          v-if="isExpanded(child._key)"
                          class="h-4 w-4 text-muted-foreground"
                        />
                        <ChevronRight v-else class="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    <!-- 字段名 -->
                    <Input
                      :model-value="child.name"
                      placeholder="字段名"
                      :disabled="disabled"
                      class="h-8 text-sm font-mono flex-1 min-w-[100px]"
                      @update:model-value="updateNode(child, 'name', String($event))"
                    />

                    <!-- 类型 -->
                    <Select
                      :model-value="child.type"
                      :disabled="disabled"
                      @update:model-value="updateNode(child, 'type', $event as ParamType)"
                    >
                      <SelectTrigger class="h-8 w-[100px] text-xs">
                        <SelectValue>
                          <span :class="cn('font-mono', typeColors[child.type])">
                            {{ child.type }}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="t in PARAM_TYPES" :key="t" :value="t">
                          <span :class="cn('font-mono', typeColors[t])">
                            {{ t }}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <!-- 必填 -->
                    <div class="w-[50px] flex justify-center">
                      <Checkbox
                        :checked="child.required"
                        :disabled="disabled"
                        @update:checked="updateNode(child, 'required', $event)"
                      />
                    </div>

                    <!-- 说明 -->
                    <Input
                      :model-value="child.description"
                      placeholder="说明"
                      :disabled="disabled"
                      class="h-8 text-sm flex-1 min-w-[100px]"
                      @update:model-value="updateNode(child, 'description', String($event))"
                    />

                    <!-- 操作 -->
                    <div class="w-[80px] flex items-center gap-1 justify-end">
                      <Button
                        v-if="child.type === 'object'"
                        variant="ghost"
                        size="icon"
                        :disabled="disabled"
                        class="h-7 w-7 opacity-0 group-hover:opacity-100"
                        title="添加子字段"
                        @click="addChildNode(child)"
                      >
                        <Plus class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        :disabled="disabled"
                        class="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                        @click="removeNode(getExpandableChildren(node), childIndex)"
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </template>

                <!-- 添加子字段按钮 -->
                <div class="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    :disabled="disabled"
                    class="h-7 text-xs text-muted-foreground"
                    @click="addChildNode(node)"
                  >
                    <Plus class="h-3 w-3 mr-1" />
                    添加子字段
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </template>
      </template>

      <!-- 空状态 -->
      <div
        v-else
        class="text-center text-muted-foreground py-8 text-sm"
      >
        暂无字段定义，点击下方按钮添加
      </div>
    </div>

    <!-- 添加根字段按钮 -->
    <Button
      variant="outline"
      size="sm"
      :disabled="disabled"
      class="w-full border-dashed"
      @click="addRootNode"
    >
      <Plus class="h-4 w-4 mr-1.5" />
      添加字段
    </Button>
  </div>
</template>
