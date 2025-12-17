<script lang="ts" setup>
import type { ApiReqData } from './types'
import type { ApiParam } from '@/types/api'
import { FileText, Hash, LinkIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HEADER_PARAMS } from '@/constants/api'
import { buildOptionList, extractPathParamNames } from '@/lib/utils'
import EditableParamTable from './EditableParamTable.vue'
import PathParamTable from './PathParamTable.vue'

const props = withDefaults(defineProps<{
  /** 参数数据 */
  params: ApiReqData
  /** API 路径（用于自动提取路径参数） */
  path?: string
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  path: '',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:params', params: ApiReqData): void
}>()

/** 当前激活的 Tab */
const activeTab = ref('query')

/** 内部数据 */
const internalParams = ref<ApiReqData>({
  pathParams: [],
  queryParams: [],
  requestHeaders: [],
})

/** 同步外部数据 */
watch(
  () => props.params,
  (newParams) => {
    internalParams.value = {
      pathParams: [...(newParams.pathParams ?? [])],
      queryParams: [...(newParams.queryParams ?? [])],
      requestHeaders: [...(newParams.requestHeaders ?? [])],
    }
  },
  { immediate: true, deep: true },
)

/**
 * 监听 path 变化，自动同步路径参数
 * 数据流：path -> 提取 {xxx} -> 保留已有参数的配置 -> 更新
 */
watch(
  () => props.path,
  (newPath) => {
    // 从路径中提取参数名
    const extractedNames = extractPathParamNames(newPath ?? '')

    // 获取现有参数的映射（用于保留用户已编辑的配置）
    const existingParamsMap = new Map<string, ApiParam>()
    for (const param of internalParams.value.pathParams) {
      existingParamsMap.set(param.name, param)
    }

    // 根据提取的参数名生成新的参数列表
    const newPathParams: ApiParam[] = extractedNames.map((name) => {
      const existing = existingParamsMap.get(name)
      if (existing) {
        // 保留已有参数的配置
        return { ...existing, required: true }
      }
      // 创建新参数（默认配置）
      return {
        name,
        type: 'string',
        required: true,
        description: '',
        example: '',
      }
    })

    // 检查是否有变化（避免不必要的更新）
    const hasChanged
      = newPathParams.length !== internalParams.value.pathParams.length
        || newPathParams.some((p, i) => p.name !== internalParams.value.pathParams[i]?.name)

    if (hasChanged) {
      internalParams.value.pathParams = newPathParams
      emitChange()
    }
  },
  { immediate: true },
)

/** 通知变化 */
function emitChange() {
  emit('update:params', { ...internalParams.value })
}

/** 更新 Path 参数（仅更新类型、示例值、说明等，不改变参数名和数量） */
function handlePathParamsChange(params: ApiParam[]) {
  internalParams.value.pathParams = params
  emitChange()
}

/** 更新 Query 参数 */
function handleQueryParamsChange(params: ApiParam[]) {
  internalParams.value.queryParams = params
  emitChange()
}

/** 更新请求头 */
function handleHeadersChange(params: ApiParam[]) {
  internalParams.value.requestHeaders = params
  emitChange()
}

/** Tab 项配置 */
const tabItems = computed(() => [
  {
    value: 'query',
    label: 'Query 参数',
    icon: Hash,
    count: internalParams.value.queryParams.length,
  },
  {
    value: 'path',
    label: 'Path 参数',
    icon: LinkIcon,
    count: internalParams.value.pathParams.length,
  },
  {
    value: 'headers',
    label: '请求头',
    icon: FileText,
    count: internalParams.value.requestHeaders.length,
  },
])
</script>

<template>
  <div class="space-y-4">
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="w-full justify-start h-9 bg-muted/50 p-1">
        <TabsTrigger
          v-for="tab in tabItems"
          :key="tab.value"
          :value="tab.value"
          class="gap-1.5 text-xs data-[state=active]:bg-background"
        >
          <component :is="tab.icon" class="h-3.5 w-3.5" />
          {{ tab.label }}
          <Badge
            v-if="tab.count > 0"
            variant="secondary"
            class="ml-1 h-5 min-w-5 px-1.5 text-[10px] font-medium"
          >
            {{ tab.count }}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <!-- Query 参数 -->
      <TabsContent value="query" class="mt-4">
        <EditableParamTable
          :params="internalParams.queryParams"
          :disabled="disabled"
          empty-text="暂无查询参数，点击添加"
          add-button-text="添加 Query 参数"
          @update:params="handleQueryParamsChange"
        />
      </TabsContent>

      <!-- Path 参数 -->
      <TabsContent value="path" class="mt-4">
        <div class="space-y-3">
          <p class="text-sm text-muted-foreground">
            路径参数从接口路径中自动提取（如
            <code class="px-1 py-0.5 bg-muted rounded text-xs font-mono">/users/{id}</code>
            中的
            <code class="px-1 py-0.5 bg-muted rounded text-xs font-mono">id</code>
            ），请在接口路径中修改
          </p>
          <PathParamTable
            :params="internalParams.pathParams"
            :disabled="disabled"
            empty-text="暂无路径参数，请在接口路径中使用 {paramName} 格式定义"
            @update:params="handlePathParamsChange"
          />
        </div>
      </TabsContent>

      <!-- 请求头 -->
      <TabsContent value="headers" class="mt-4">
        <EditableParamTable
          :params="internalParams.requestHeaders"
          :disabled="disabled"
          :show-type="false"
          :show-required="false"
          :param-name-options="buildOptionList(HEADER_PARAMS)"
          empty-text="暂无请求头，点击添加"
          add-button-text="添加请求头"
          @update:params="handleHeadersChange"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
