<script lang="ts" setup>
import type { ApiParam, LocalApiRequestBody, RequestBodyType } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import { FileCode, FileJson, FormInput, Upload } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import JsonSchemaEditor from '@/components/common/JsonSchemaEditor.vue'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { FORM_DATA_TYPES, PARAM_TYPES, REQUEST_BODY_TYPES, requestBodyTypeLabels } from '@/constants/api'
import { genRootSchemaNode } from '@/lib/json-schema'
import EditableParamTable from './EditableParamTable.vue'

const props = withDefaults(defineProps<{
  /** 请求体数据 */
  body: LocalApiRequestBody | null
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:body', body: LocalApiRequestBody | null): void
}>()

/** 内部数据 */
const internalBody = ref<LocalApiRequestBody>({
  type: 'none',
  jsonSchema: undefined,
  formFields: [],
  rawContentType: 'text/plain',
  description: '',
})

/** 同步外部数据 */
watch(
  () => props.body,
  (newBody) => {
    if (newBody) {
      internalBody.value = {
        type: newBody.type ?? 'none',
        jsonSchema: newBody.jsonSchema,
        formFields: newBody.formFields ? [...newBody.formFields] : [],
        rawContentType: newBody.rawContentType ?? 'text/plain',
        description: newBody.description ?? '',
        example: newBody.example,
      }
    }
    else {
      internalBody.value = {
        type: 'none',
        jsonSchema: undefined,
        formFields: [],
        rawContentType: 'text/plain',
        description: '',
      }
    }
  },
  { immediate: true, deep: true },
)

/** 通知变化 */
function emitChange() {
  emit('update:body', { ...internalBody.value })
}

/** 更新请求体类型 */
function handleTypeChange(type: RequestBodyType) {
  if (props.disabled)
    return

  const prevType = internalBody.value.type
  internalBody.value.type = type

  // 根据类型初始化默认值
  if (type === 'json' && !internalBody.value.jsonSchema) {
    internalBody.value.jsonSchema = genRootSchemaNode()
  }
  if ((type === 'form-data' || type === 'x-www-form-urlencoded') && !internalBody.value.formFields) {
    internalBody.value.formFields = []
  }

  // 从 form-data 切换到 x-www-form-urlencoded 时，需要将 file 类型重置为 string
  if (prevType === 'form-data' && type === 'x-www-form-urlencoded' && internalBody.value.formFields) {
    const targetItems = internalBody.value.formFields.filter(field => field.type === 'file')
    targetItems.forEach(item => item.type = 'string')
  }

  emitChange()
}

/** 更新 JSON Schema */
function handleSchemaChange(schema: LocalSchemaNode) {
  internalBody.value.jsonSchema = schema
  emitChange()
}

/** 更新表单字段 */
function handleFormFieldsChange(fields: ApiParam[]) {
  internalBody.value.formFields = fields
  emitChange()
}

/** 更新描述 */
function handleDescriptionChange(description: string) {
  internalBody.value.description = description
  emitChange()
}

/** 是否是 JSON 类型 */
const isJsonType = computed(() => internalBody.value.type === 'json')

/** 是否是表单类型 */
const isFormType = computed(() =>
  internalBody.value.type === 'form-data' || internalBody.value.type === 'x-www-form-urlencoded',
)

const isFormData = computed(() => internalBody.value.type === 'form-data')

/** 是否是二进制类型 */
const isBinaryType = computed(() => internalBody.value.type === 'binary')

/** 是否是原始类型 */
const isRawType = computed(() => internalBody.value.type === 'raw')

/** 是否是 none */
const isNoneType = computed(() => internalBody.value.type === 'none')

/** Content-Type */
const contentType = computed(() => {
  switch (internalBody.value.type) {
    case 'json':
      return 'application/json'
    case 'form-data':
      return 'multipart/form-data'
    case 'x-www-form-urlencoded':
      return 'application/x-www-form-urlencoded'
    case 'binary':
      return 'application/octet-stream'
    case 'raw':
      return internalBody.value.rawContentType ?? 'text/plain'
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
        :model-value="internalBody.type"
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
        v-if="internalBody.jsonSchema"
        :model-value="internalBody.jsonSchema"
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
        v-if="internalBody.formFields"
        :params="internalBody.formFields"
        :disabled="disabled"
        :param-type-options="isFormData ? FORM_DATA_TYPES : PARAM_TYPES"
        empty-text="暂无表单字段，点击添加"
        add-button-text="添加表单字段"
        @update:params="handleFormFieldsChange"
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
        :model-value="internalBody.description ?? ''"
        placeholder="请输入请求体描述（可选）"
        :disabled="disabled"
        rows="2"
        class="resize-none"
        @update:model-value="handleDescriptionChange(String($event))"
      />
    </div>
  </div>
</template>
