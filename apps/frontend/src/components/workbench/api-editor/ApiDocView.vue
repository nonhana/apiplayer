<script lang="ts" setup>
import type { ApiDetail, ApiParam, ApiRequestBody as ApiRequestBodyType, ApiResponse } from '@/types/api'
import { computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import ApiBasicInfo from './ApiBasicInfo.vue'
import ApiMetadata from './ApiMetadata.vue'
import ApiRequestBodySection from './ApiRequestBody.vue'
import ApiRequestParams from './ApiRequestParams.vue'
import ApiResponses from './ApiResponses.vue'

const props = defineProps<{
  /** API 详情数据 */
  api: ApiDetail
}>()

/** 请求头参数 */
const requestHeaders = computed<ApiParam[]>(() => {
  return (props.api.requestHeaders ?? []) as ApiParam[]
})

/** 路径参数 */
const pathParams = computed<ApiParam[]>(() => {
  return (props.api.pathParams ?? []) as ApiParam[]
})

/** 查询参数 */
const queryParams = computed<ApiParam[]>(() => {
  return (props.api.queryParams ?? []) as ApiParam[]
})

/** 请求体 */
const requestBody = computed<ApiRequestBodyType | undefined>(() => {
  return props.api.requestBody as ApiRequestBodyType | undefined
})

/** 响应列表 */
const responses = computed<ApiResponse[]>(() => {
  return (props.api.responses ?? []) as ApiResponse[]
})
</script>

<template>
  <ScrollArea class="h-full">
    <div class="w-full p-6 space-y-8">
      <!-- 主内容区域：左右布局 -->
      <div class="flex gap-6">
        <!-- 左侧：主要内容 -->
        <div class="flex-1 min-w-0 space-y-8">
          <!-- 基本信息 -->
          <ApiBasicInfo :api="api" />

          <Separator />

          <!-- 请求参数 -->
          <ApiRequestParams
            :headers="requestHeaders"
            :path-params="pathParams"
            :query-params="queryParams"
          />

          <Separator />

          <!-- 请求体 -->
          <ApiRequestBodySection :body="requestBody" />

          <Separator />

          <!-- 响应定义 -->
          <ApiResponses :responses="responses" />
        </div>

        <!-- 右侧：元数据 -->
        <div class="w-64 shrink-0">
          <div class="sticky top-6">
            <ApiMetadata :api="api" />
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>
</template>
