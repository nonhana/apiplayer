<script lang="ts" setup>
import type { ApiRequestBody } from '@/types/api'
import { FileJson, FormInput } from 'lucide-vue-next'
import { computed } from 'vue'
import JsonSchemaPreviewer from '@/components/common/JsonSchemaPreviewer.vue'
import { Badge } from '@/components/ui/badge'
import { requestBodyTypeLabels } from '@/constants/api'
import JsonPreview from './JsonPreview.vue'
import ParamTable from './ParamTable.vue'

const props = defineProps<{
  /** 请求体定义 */
  body?: ApiRequestBody
}>()

/** 是否有请求体 */
const hasBody = computed(() => {
  if (!props.body)
    return false
  if (props.body.type === 'none')
    return false
  return true
})

/** 请求体类型标签 */
const typeLabel = computed(() => {
  if (!props.body)
    return ''
  return requestBodyTypeLabels[props.body.type] ?? props.body.type
})

/** 是否是 JSON 类型 */
const isJsonType = computed(() => props.body?.type === 'json')

/** 是否是表单类型 */
const isFormType = computed(() =>
  props.body?.type === 'form-data' || props.body?.type === 'x-www-form-urlencoded',
)

/** Content-Type */
const contentType = computed(() => {
  if (!props.body)
    return ''
  switch (props.body.type) {
    case 'json':
      return 'application/json'
    case 'form-data':
      return 'multipart/form-data'
    case 'x-www-form-urlencoded':
      return 'application/x-www-form-urlencoded'
    case 'binary':
      return 'application/octet-stream'
    case 'raw':
      return props.body.rawContentType ?? 'text/plain'
    default:
      return ''
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-base font-semibold">
        请求体
      </h3>
      <div v-if="hasBody" class="flex items-center gap-2">
        <Badge variant="outline" class="font-mono text-xs">
          {{ typeLabel }}
        </Badge>
        <Badge v-if="contentType" variant="secondary" class="font-mono text-xs">
          {{ contentType }}
        </Badge>
      </div>
    </div>

    <div v-if="hasBody">
      <div v-if="isJsonType" class="space-y-4">
        <p v-if="body?.description" class="text-sm text-muted-foreground">
          {{ body.description }}
        </p>

        <div v-if="body?.jsonSchema" class="space-y-2">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <FileJson class="h-4 w-4" />
            <span>JSON Schema</span>
          </div>
          <JsonSchemaPreviewer :schema="body.jsonSchema" max-height="300px" />
        </div>

        <div v-if="body?.example" class="space-y-2">
          <div class="text-sm text-muted-foreground">
            示例
          </div>
          <JsonPreview :data="body.example" max-height="200px" />
        </div>
      </div>

      <div v-else-if="isFormType" class="space-y-4">
        <p v-if="body?.description" class="text-sm text-muted-foreground">
          {{ body.description }}
        </p>

        <div v-if="body?.formFields && body.formFields.length > 0">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FormInput class="h-4 w-4" />
            <span>表单字段</span>
          </div>
          <ParamTable :params="body.formFields" />
        </div>

        <div
          v-else
          class="text-center py-6 text-muted-foreground text-sm border rounded-md bg-muted/30"
        >
          暂无表单字段定义
        </div>
      </div>

      <div v-else class="space-y-2">
        <p v-if="body?.description" class="text-sm text-muted-foreground">
          {{ body.description }}
        </p>
        <div
          class="text-center py-6 text-muted-foreground text-sm border rounded-md bg-muted/30"
        >
          {{ body?.type === 'binary' ? '二进制文件上传' : '原始数据内容' }}
        </div>
      </div>
    </div>

    <div
      v-else
      class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30"
    >
      该接口没有请求体
    </div>
  </div>
</template>
