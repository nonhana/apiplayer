<script lang="ts" setup>
import type { ApiReqData } from './types'
import type { ApiParam } from '@/types/api'
import { FileText, Hash, LinkIcon } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EditableParamTable from './EditableParamTable.vue'

const props = withDefaults(defineProps<{
  /** 参数数据 */
  params: ApiReqData
  /** 是否禁用 */
  disabled?: boolean
}>(), {
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

/** 通知变化 */
function emitChange() {
  emit('update:params', { ...internalParams.value })
}

/** 更新 Path 参数 */
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
            ）
          </p>
          <EditableParamTable
            :params="internalParams.pathParams"
            :disabled="disabled"
            :show-default="false"
            empty-text="暂无路径参数"
            add-button-text="添加 Path 参数"
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
          empty-text="暂无请求头，点击添加"
          add-button-text="添加请求头"
          @update:params="handleHeadersChange"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
