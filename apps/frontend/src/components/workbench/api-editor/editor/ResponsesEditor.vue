<script lang="ts" setup>
import type { LocalApiResItem } from '@/components/workbench/api-editor/editor/types'
import type { LocalSchemaNode } from '@/types/json-schema'
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import JsonSchemaEditor from '@/components/json-schema/JsonSchemaEditor.vue'
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
import { HTTP_STATUS_CODES, httpStatusLabels, resStatusStyles } from '@/constants/api'
import { genRootSchemaNode } from '@/lib/json-schema'
import { cn } from '@/lib/utils'
import { useApiEditorStore } from '@/stores/useApiEditorStore'

withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const apiEditorStore = useApiEditorStore()
const { responses } = storeToRefs(apiEditorStore)
const {
  addResponse,
  removeResponse,
  updateResponseField,
  updateResponseBody,
} = apiEditorStore

const expandedKeys = ref<Set<string>>(new Set())

watch(responses, (newV) => {
  if (newV.length > 0 && expandedKeys.value.size === 0) {
    expandedKeys.value.add(newV[0]!.id)
  }
}, { immediate: true, deep: true })

function getStatusType(status: number) {
  if (status >= 200 && status < 300)
    return 'success'
  if (status >= 300 && status < 400)
    return 'redirect'
  if (status >= 400 && status < 500)
    return 'client-error'
  return 'server-error'
}

function getStatusClass(status: number) {
  return resStatusStyles[getStatusType(status)]
}

function getStatusLabel(status: number) {
  return httpStatusLabels[status as keyof typeof httpStatusLabels] ?? ''
}

function getStatusIcon(status: number) {
  const type = getStatusType(status)
  return type === 'success' ? Check : X
}

function toggleExpand(key: string) {
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key)
  }
  else {
    expandedKeys.value.add(key)
  }
}

function isExpanded(key: string): boolean {
  return expandedKeys.value.has(key)
}

function handleAdd() {
  const newId = addResponse()
  expandedKeys.value.add(newId)
}

function handleAddBody(index: number) {
  updateResponseBody(index, genRootSchemaNode())
}

function handleRemove(index: number) {
  const response = responses.value[index]
  if (response) {
    expandedKeys.value.delete(response.id)
  }
  removeResponse(index)
}

function updateField<K extends keyof LocalApiResItem>(index: number, key: K, value: LocalApiResItem[K]) {
  updateResponseField(index, key, value)
}

function updateLocalSchema(index: number, schema: LocalSchemaNode) {
  updateResponseBody(index, schema)
}

function handleDelRoot(index: number) {
  updateResponseBody(index, undefined)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="responses.length > 0" class="space-y-3">
      <Collapsible
        v-for="(response, index) in responses"
        :key="response.id"
        :open="isExpanded(response.id)"
        class="border rounded-lg overflow-hidden"
      >
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

        <CollapsibleContent>
          <div class="border-t p-4 space-y-4 bg-muted/20">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>响应名称</Label>
                <Input
                  :model-value="response.name"
                  placeholder="如：成功响应"
                  :disabled="disabled"
                  @update:model-value="updateField(index, 'name', String($event))"
                />
              </div>

              <div class="space-y-2">
                <Label>HTTP 状态码</Label>
                <Select
                  :model-value="response.httpStatus"
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
                      v-for="status in HTTP_STATUS_CODES"
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

            <div class="space-y-2">
              <Label>响应体结构</Label>
              <JsonSchemaEditor
                v-if="response.body"
                :model-value="response.body"
                @update:model-value="updateLocalSchema(index, $event)"
                @del-root="handleDelRoot(index)"
              />
              <div v-else class="space-y-2">
                <div class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30">
                  暂无响应体结构（void）
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="disabled"
                  class="w-full border-dashed"
                  @click="handleAddBody(index)"
                >
                  <Plus class="h-4 w-4 mr-1.5" />
                  添加响应体结构
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <div
      v-else
      class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30"
    >
      暂无响应定义，点击下方按钮添加
    </div>

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
