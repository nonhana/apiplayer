<script lang="ts" setup>
import type { RequestBodyType } from '@/types/api'
import { FileCode, FileJson, FormInput, Upload } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import JsonSchemaEditor from '@/components/json-schema/JsonSchemaEditor.vue'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  BODY_NAME_MAP,
  FORM_DATA_TYPES,
  PARAM_TYPES,
  REQUEST_BODY_TYPES,
  requestBodyTypeLabels,
} from '@/constants/api'
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import EditableParamTable from './EditableParamTable.vue'

withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false,
})

const typeIcons = {
  'none': FileCode,
  'json': FileJson,
  'form-data': FormInput,
  'x-www-form-urlencoded': FormInput,
  'binary': Upload,
  'raw': FileCode,
} as const

const apiEditorStore = useApiEditorStore()
const { requestBody } = storeToRefs(apiEditorStore)
const {
  updateRequestBodyType,
  updateRequestBodySchema,
  updateRequestBodyDescription,
  addParam,
  removeParam,
  updateParam,
} = apiEditorStore

const currentType = computed(() => requestBody.value?.type ?? 'none')

const isJsonType = computed(() => currentType.value === 'json')

const isFormType = computed(() =>
  currentType.value === 'form-data' || currentType.value === 'x-www-form-urlencoded',
)

const isFormData = computed(() => currentType.value === 'form-data')
const isBinaryType = computed(() => currentType.value === 'binary')
const isRawType = computed(() => currentType.value === 'raw')
const isNoneType = computed(() => currentType.value === 'none')
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3">
      <div class="flex items-center gap-3 h-6">
        <Label>请求体类型</Label>
        <Badge v-if="BODY_NAME_MAP[currentType]" variant="outline" class="font-mono text-xs">
          {{ BODY_NAME_MAP[currentType] }}
        </Badge>
      </div>

      <RadioGroup
        :model-value="currentType"
        :disabled="disabled"
        class="flex flex-wrap gap-2"
        @update:model-value="updateRequestBodyType($event as RequestBodyType)"
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

    <!-- None -->
    <div
      v-if="isNoneType"
      class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30"
    >
      该接口不需要请求体
    </div>

    <!-- JSON -->
    <div v-else-if="isJsonType" class="space-y-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <FileJson class="h-4 w-4" />
        <span>JSON Schema 结构定义</span>
      </div>
      <JsonSchemaEditor
        v-if="requestBody?.jsonSchema"
        :model-value="requestBody.jsonSchema"
        @update:model-value="updateRequestBodySchema"
      />
    </div>

    <!-- Form -->
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
        @add="addParam('request-body')"
        @remove="removeParam('request-body', $event)"
        @update="(index, key, value) => updateParam('request-body', index, key, value)"
      />
    </div>

    <!-- Binary -->
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

    <!-- Raw -->
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

    <div v-if="!isNoneType" class="space-y-2">
      <Label>请求体描述</Label>
      <Textarea
        :model-value="requestBody?.description ?? ''"
        placeholder="请输入请求体描述（可选）"
        :disabled="disabled"
        rows="2"
        class="resize-none"
        @update:model-value="updateRequestBodyDescription($event as string)"
      />
    </div>
  </div>
</template>
