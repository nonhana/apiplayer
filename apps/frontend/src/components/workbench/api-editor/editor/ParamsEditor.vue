<script lang="ts" setup>
import type { ApiParam } from '@/types/api'
import { FileText, Hash, LinkIcon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HEADER_PARAMS, PARAM_TYPES } from '@/constants/api'
import { buildOptionList } from '@/lib/utils'
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import EditableParamTable from './EditableParamTable.vue'
import PathParamTable from './PathParamTable.vue'

withDefaults(defineProps<{
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  disabled: false,
})

const apiEditorStore = useApiEditorStore()
const { paramsData } = storeToRefs(apiEditorStore)

/** 当前激活的 Tab */
const activeTab = ref('query')

/** 更新路径参数（仅更新类型、示例值、说明等，不改变参数名和数量） */
function handlePathParamsChange(params: ApiParam[]) {
  apiEditorStore.updatePathParams(params)
}

/** 更新查询参数 */
function handleQueryParamsChange(params: ApiParam[]) {
  apiEditorStore.updateQueryParams(params)
}

/** 更新请求头 */
function handleHeadersChange(params: ApiParam[]) {
  apiEditorStore.updateRequestHeaders(params)
}

/** Tab 项配置 */
const tabItems = computed(() => [
  {
    value: 'query',
    label: 'Query 参数',
    icon: Hash,
    count: paramsData.value.queryParams.length,
  },
  {
    value: 'path',
    label: 'Path 参数',
    icon: LinkIcon,
    count: paramsData.value.pathParams.length,
  },
  {
    value: 'headers',
    label: '请求头',
    icon: FileText,
    count: paramsData.value.requestHeaders.length,
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
          :params="paramsData.queryParams"
          :disabled="disabled"
          :param-type-options="PARAM_TYPES"
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
            :params="paramsData.pathParams"
            :disabled="disabled"
            empty-text="暂无路径参数，请在接口路径中使用 {paramName} 格式定义"
            @update:params="handlePathParamsChange"
          />
        </div>
      </TabsContent>

      <!-- 请求头 -->
      <TabsContent value="headers" class="mt-4">
        <EditableParamTable
          :params="paramsData.requestHeaders"
          :disabled="disabled"
          :show-type="false"
          :show-required="false"
          :param-type-options="PARAM_TYPES"
          :param-name-options="buildOptionList(HEADER_PARAMS)"
          empty-text="暂无请求头，点击添加"
          add-button-text="添加请求头"
          @update:params="handleHeadersChange"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
