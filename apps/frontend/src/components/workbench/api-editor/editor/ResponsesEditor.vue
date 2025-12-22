<script lang="ts" setup>
import type { ApiResponse } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import JsonSchemaEditor from '@/components/common/JsonSchemaEditor.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HTTP_STATUS_CATEGORIES, httpStatusLabels } from '@/constants/api'
import { genRootSchemaNode, nodeToSchema, schemaToNode } from '@/lib/json-schema'
import { cn } from '@/lib/utils'

/** 内部响应项（带唯一 key 和本地 schema） */
interface ResponseItem extends Omit<ApiResponse, 'body'> {
  _key: string
  /** 本地 schema 节点（用于编辑器） */
  localSchema: LocalSchemaNode
}

const props = withDefaults(defineProps<{
  /** 响应列表 */
  responses: ApiResponse[]
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:responses', responses: ApiResponse[]): void
}>()

/** 生成唯一 key */
function generateKey() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** 内部响应列表 */
const internalResponses = ref<ResponseItem[]>([])

/** 展开状态 */
const expandedKeys = ref<Set<string>>(new Set())

/** 同步外部数据 */
watch(
  () => props.responses,
  (newResponses) => {
    internalResponses.value = newResponses.map((r) => {
      const { body, ...rest } = r
      return {
        ...rest,
        _key: generateKey(),
        // 将 body（JSON Schema）转换为本地节点
        localSchema: schemaToNode(body as Record<string, unknown> | null),
      }
    })
    // 默认展开第一个
    if (internalResponses.value.length > 0 && expandedKeys.value.size === 0) {
      expandedKeys.value.add(internalResponses.value[0]!._key)
    }
  },
  { immediate: true, deep: true },
)

/** 通知变化 */
function emitChange() {
  const responses: ApiResponse[] = internalResponses.value.map(({ _key, localSchema, ...rest }) => ({
    ...rest,
    // 将本地节点转换回 JSON Schema
    body: nodeToSchema(localSchema),
  }))
  emit('update:responses', responses)
}

/** 常用 HTTP 状态码选项 */
const statusOptions = [
  ...HTTP_STATUS_CATEGORIES.success,
  ...HTTP_STATUS_CATEGORIES.clientError,
  ...HTTP_STATUS_CATEGORIES.serverError,
].sort((a, b) => a - b)

/** 获取状态码类型 */
function getStatusType(status: number) {
  if (status >= 200 && status < 300)
    return 'success'
  if (status >= 300 && status < 400)
    return 'redirect'
  if (status >= 400 && status < 500)
    return 'client-error'
  return 'server-error'
}

/** 状态码样式 */
const statusStyles = {
  'success': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'redirect': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'client-error': 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  'server-error': 'bg-red-500/15 text-red-600 border-red-500/30',
}

/** 获取状态码样式 */
function getStatusClass(status: number) {
  return statusStyles[getStatusType(status)]
}

/** 获取状态码描述 */
function getStatusLabel(status: number) {
  return httpStatusLabels[status] ?? ''
}

/** 状态码图标 */
function getStatusIcon(status: number) {
  const type = getStatusType(status)
  return type === 'success' ? Check : X
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

/** 是否展开 */
function isExpanded(key: string): boolean {
  return expandedKeys.value.has(key)
}

/** 添加响应 */
function handleAdd() {
  if (props.disabled)
    return

  const newResponse: ResponseItem = {
    _key: generateKey(),
    name: '成功响应',
    httpStatus: 200,
    description: '',
    localSchema: genRootSchemaNode(),
  }

  internalResponses.value.push(newResponse)
  expandedKeys.value.add(newResponse._key)
  emitChange()
}

/** 删除响应 */
function handleRemove(index: number) {
  if (props.disabled)
    return

  const removed = internalResponses.value.splice(index, 1)[0]
  if (removed) {
    expandedKeys.value.delete(removed._key)
  }
  emitChange()
}

/** 更新响应字段 */
function updateField<K extends keyof ApiResponse>(index: number, key: K, value: ApiResponse[K]) {
  if (props.disabled)
    return

  const response = internalResponses.value[index]
  if (response) {
    (response as ApiResponse)[key] = value
    emitChange()
  }
}

/** 更新响应体 Schema（通过 v-model 自动触发） */
function updateLocalSchema(index: number, schema: LocalSchemaNode) {
  if (props.disabled)
    return

  const response = internalResponses.value[index]
  if (response) {
    response.localSchema = schema
    emitChange()
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 响应列表 -->
    <div v-if="internalResponses.length > 0" class="space-y-3">
      <Collapsible
        v-for="(response, index) in internalResponses"
        :key="response._key"
        :open="isExpanded(response._key)"
        class="border rounded-lg overflow-hidden"
      >
        <!-- 响应头部 -->
        <CollapsibleTrigger
          class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors"
          @click="toggleExpand(response._key)"
        >
          <div class="flex items-center gap-3">
            <Badge :class="cn('font-mono text-xs px-2', getStatusClass(response.httpStatus))">
              <component
                :is="getStatusIcon(response.httpStatus)"
                class="h-3 w-3 mr-1"
              />
              {{ response.httpStatus }}
            </Badge>
            <span v-if="getStatusLabel(response.httpStatus)" class="text-xs text-muted-foreground">
              {{ getStatusLabel(response.httpStatus) }}
            </span>
            <span class="text-sm font-medium">
              {{ response.name }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              :disabled="disabled"
              class="h-7 w-7 text-muted-foreground hover:text-destructive"
              @click.stop="handleRemove(index)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
            <ChevronDown
              :class="cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                isExpanded(response._key) && 'rotate-180',
              )"
            />
          </div>
        </CollapsibleTrigger>

        <!-- 响应内容 -->
        <CollapsibleContent>
          <div class="border-t p-4 space-y-4 bg-muted/20">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-4">
              <!-- 响应名称 -->
              <div class="space-y-2">
                <Label>响应名称</Label>
                <Input
                  :model-value="response.name"
                  placeholder="如：成功响应"
                  :disabled="disabled"
                  @update:model-value="updateField(index, 'name', String($event))"
                />
              </div>

              <!-- HTTP 状态码 -->
              <div class="space-y-2">
                <Label>HTTP 状态码</Label>
                <Select
                  :model-value="String(response.httpStatus)"
                  :disabled="disabled"
                  @update:model-value="updateField(index, 'httpStatus', Number($event))"
                >
                  <SelectTrigger :class="getStatusClass(response.httpStatus)">
                    <SelectValue>
                      {{ response.httpStatus }} - {{ getStatusLabel(response.httpStatus) }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="status in statusOptions"
                      :key="status"
                      :value="String(status)"
                    >
                      <span :class="getStatusClass(status)">
                        {{ status }} - {{ getStatusLabel(status) }}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- 响应描述 -->
            <div class="space-y-2">
              <Label>响应描述</Label>
              <Textarea
                :model-value="response.description ?? ''"
                placeholder="请输入响应描述（可选）"
                :disabled="disabled"
                rows="2"
                class="resize-none"
                @update:model-value="updateField(index, 'description', String($event))"
              />
            </div>

            <!-- 响应体 Schema -->
            <div class="space-y-2">
              <Label>响应体结构</Label>
              <JsonSchemaEditor
                :model-value="response.localSchema"
                @update:model-value="updateLocalSchema(index, $event)"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30"
    >
      暂无响应定义，点击下方按钮添加
    </div>

    <!-- 添加按钮 -->
    <Button
      variant="outline"
      size="sm"
      :disabled="disabled"
      class="w-full border-dashed"
      @click="handleAdd"
    >
      <Plus class="h-4 w-4 mr-1.5" />
      添加响应
    </Button>
  </div>
</template>
