<script lang="ts" setup>
import type { ApiParam, RequestBodyType } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import { FileCode, FileJson, FormInput, Upload } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import JsonSchemaEditor from '@/components/common/JsonSchemaEditor.vue'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { FORM_DATA_TYPES, PARAM_TYPES, REQUEST_BODY_TYPES, requestBodyTypeLabels } from '@/constants/api'
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import EditableParamTable from './EditableParamTable.vue'

withDefaults(defineProps<{
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  disabled: false,
})

const apiEditorStore = useApiEditorStore()
const { requestBody } = storeToRefs(apiEditorStore)

/** 当前请求体类型 */
const currentType = computed(() => requestBody.value?.type ?? 'none')

/** 是否是 JSON 类型 */
const isJsonType = computed(() => currentType.value === 'json')

/** 是否是表单类型 */
const isFormType = computed(() =>
  currentType.value === 'form-data' || currentType.value === 'x-www-form-urlencoded',
)

const isFormData = computed(() => currentType.value === 'form-data')

/** 是否是二进制类型 */
const isBinaryType = computed(() => currentType.value === 'binary')

/** 是否是原始类型 */
const isRawType = computed(() => currentType.value === 'raw')

/** 是否是 none */
const isNoneType = computed(() => currentType.value === 'none')

/** Content-Type */
const contentType = computed(() => {
  switch (currentType.value) {
    case 'json':
      return 'application/json'
    case 'form-data':
      return 'multipart/form-data'
    case 'x-www-form-urlencoded':
      return 'application/x-www-form-urlencoded'
    case 'binary':
      return 'application/octet-stream'
    case 'raw':
      return requestBody.value?.rawContentType ?? 'text/plain'
    default:
      return ''
  }
})

/** 类型图标映射 */
const typeIcons: Record<RequestBodyType, typeof FileJson> = {
  'none': FileCode,
  'json': FileJson,
  'form-data': FormInput,
  'x-www-form-urlencoded': FormInput,
  'binary': Upload,
  'raw': FileCode,
}

/** 更新请求体类型 */
function handleTypeChange(type: RequestBodyType) {
  apiEditorStore.updateRequestBodyType(type)
}

/** 更新 JSON Schema */
function handleSchemaChange(schema: LocalSchemaNode) {
  apiEditorStore.updateRequestBodySchema(schema)
}

/** 更新描述 */
function handleDescriptionChange(description: string) {
  apiEditorStore.updateRequestBodyDescription(description)
}

function handleAddFormField() {
  apiEditorStore.addParam('request-body')
}

function handleRemoveFormField(index: number) {
  apiEditorStore.removeParam('request-body', index)
}

function handleUpdateFormField(index: number, key: keyof ApiParam, value: ApiParam[keyof ApiParam]) {
  apiEditorStore.updateParam('request-body', index, key, value)
}
</script>

<template>
  <div class="space-y-6">
    <!-- 类型选择 -->
    <div class="space-y-3">
      <div class="flex items-center gap-3 h-6">
        <Label>请求体类型</Label>
        <Badge v-if="contentType" variant="outline" class="font-mono text-xs">
          {{ contentType }}
        </Badge>
      </div>

      <RadioGroup
        :model-value="currentType"
        :disabled="disabled"
        class="flex flex-wrap gap-2"
        @update:model-value="handleTypeChange($event as RequestBodyType)"
      >
        <div
          v-for="type in REQUEST_BODY_TYPES"
          :key="type"
          class="flex items-center"
        >
          <RadioGroupItem :id="`body-type-${type}`" :value="type" class="peer sr-only" />
          <Label
            :for="`body-type-${type}`"
            class="flex items-center gap-1.5 px-3 py-2 border rounded-md cursor-pointer
                   peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                   hover:bg-muted/50 transition-colors text-sm"
          >
            <component :is="typeIcons[type]" class="h-4 w-4" />
            {{ requestBodyTypeLabels[type] }}
          </Label>
        </div>
      </RadioGroup>
    </div>

    <!-- none 类型 -->
    <div
      v-if="isNoneType"
      class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30"
    >
      该接口不需要请求体
    </div>

    <!-- JSON 类型 -->
    <div v-else-if="isJsonType" class="space-y-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <FileJson class="h-4 w-4" />
        <span>JSON Schema 结构定义</span>
      </div>
      <JsonSchemaEditor
        v-if="requestBody?.jsonSchema"
        :model-value="requestBody.jsonSchema"
        @update:model-value="handleSchemaChange"
      />
    </div>

    <!-- 表单类型 -->
    <div v-else-if="isFormType" class="space-y-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <FormInput class="h-4 w-4" />
        <span>表单字段定义</span>
      </div>
      <EditableParamTable
        :params="requestBody?.formFields ?? []"
        :disabled="disabled"
        :param-type-options="isFormData ? FORM_DATA_TYPES : PARAM_TYPES"
        empty-text="暂无表单字段，点击添加"
        add-button-text="添加表单字段"
        @add="handleAddFormField"
        @remove="handleRemoveFormField"
        @update="handleUpdateFormField"
      />
    </div>

    <!-- 二进制类型 -->
    <div
      v-else-if="isBinaryType"
      class="space-y-4"
    >
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Upload class="h-4 w-4" />
        <span>二进制文件上传</span>
      </div>
      <div class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30">
        客户端需要上传二进制文件
      </div>
    </div>

    <!-- 原始类型 -->
    <div
      v-else-if="isRawType"
      class="space-y-4"
    >
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <FileCode class="h-4 w-4" />
        <span>原始文本数据</span>
      </div>
      <div class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30">
        客户端发送原始文本数据
      </div>
    </div>

    <!-- 描述 -->
    <div v-if="!isNoneType" class="space-y-2">
      <Label>请求体描述</Label>
      <Textarea
        :model-value="requestBody?.description ?? ''"
        placeholder="请输入请求体描述（可选）"
        :disabled="disabled"
        rows="2"
        class="resize-none"
        @update:model-value="handleDescriptionChange(String($event))"
      />
    </div>
  </div>
</template>
