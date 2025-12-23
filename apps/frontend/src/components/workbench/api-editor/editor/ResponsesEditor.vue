<script lang="ts" setup>
import type { LocalApiResItem } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
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
import { cn } from '@/lib/utils'
import { useApiEditorStore } from '@/stores/useApiEditorStore'

withDefaults(defineProps<{
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  disabled: false,
})

const apiEditorStore = useApiEditorStore()
const { responses } = storeToRefs(apiEditorStore)

/** 展开状态 */
const expandedKeys = ref<Set<string>>(new Set())

watch(responses, (newV) => {
  if (newV.length > 0 && expandedKeys.value.size === 0) {
    expandedKeys.value.add(newV[0]!.id)
  }
}, { immediate: true, deep: true })

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
  const newId = apiEditorStore.addResponse()
  expandedKeys.value.add(newId)
}

/** 删除响应 */
function handleRemove(index: number) {
  const response = responses.value[index]
  if (response) {
    expandedKeys.value.delete(response.id)
  }
  apiEditorStore.removeResponse(index)
}

/** 更新响应字段 */
function updateField<K extends keyof LocalApiResItem>(index: number, key: K, value: LocalApiResItem[K]) {
  apiEditorStore.updateResponseField(index, key, value)
}

/** 更新响应体 Schema */
function updateLocalSchema(index: number, schema: LocalSchemaNode) {
  apiEditorStore.updateResponseBody(index, schema)
}
</script>

<template>
  <div class="space-y-4">
    <!-- 响应列表 -->
    <div v-if="responses.length > 0" class="space-y-3">
      <Collapsible
        v-for="(response, index) in responses"
        :key="response.id"
        :open="isExpanded(response.id)"
        class="border rounded-lg overflow-hidden"
      >
        <!-- 响应头部 -->
        <CollapsibleTrigger
          class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors"
          @click="toggleExpand(response.id)"
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
                isExpanded(response.id) && 'rotate-180',
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
                v-if="response.body"
                :model-value="response.body"
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
