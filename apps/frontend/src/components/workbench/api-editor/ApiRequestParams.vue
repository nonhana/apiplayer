<script lang="ts" setup>
import type { ApiParam } from '@/types/api'
import { FileText, Hash, LinkIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ParamTable from './ParamTable.vue'

const props = defineProps<{
  /** 请求头参数 */
  headers: ApiParam[]
  /** 路径参数 */
  pathParams: ApiParam[]
  /** 查询参数 */
  queryParams: ApiParam[]
}>()

/** 是否有请求头 */
const hasHeaders = computed(() => props.headers.length > 0)

/** 是否有路径参数 */
const hasPathParams = computed(() => props.pathParams.length > 0)

/** 是否有查询参数 */
const hasQueryParams = computed(() => props.queryParams.length > 0)

/** 是否有参数 */
const hasParams = computed(() =>
  hasHeaders.value || hasPathParams.value || hasQueryParams.value,
)

/** 默认激活的 Tab */
const defaultTab = computed(() => {
  if (hasPathParams.value)
    return 'path'
  if (hasQueryParams.value)
    return 'query'
  if (hasHeaders.value)
    return 'headers'
  return 'path'
})

/** Tab 项配置 */
const tabItems = computed(() => [
  {
    value: 'path',
    label: 'Path 参数',
    icon: LinkIcon,
    count: props.pathParams.length,
    show: true,
  },
  {
    value: 'query',
    label: 'Query 参数',
    icon: Hash,
    count: props.queryParams.length,
    show: true,
  },
  {
    value: 'headers',
    label: '请求头',
    icon: FileText,
    count: props.headers.length,
    show: true,
  },
])
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold">
        请求参数
      </h3>
    </div>

    <div v-if="hasParams">
      <Tabs :default-value="defaultTab" class="w-full">
        <TabsList class="w-full justify-start h-9 bg-muted/50 p-1">
          <TabsTrigger
            v-for="tab in tabItems"
            v-show="tab.show"
            :key="tab.value"
            :value="tab.value"
            class="gap-1.5 text-xs data-[state=active]:bg-background"
          >
            <component :is="tab.icon" class="h-3.5 w-3.5" />
            {{ tab.label }}
            <span
              v-if="tab.count > 0"
              class="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
            >
              {{ tab.count }}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="path" class="mt-4">
          <ParamTable
            :params="pathParams"
            :show-default="false"
            empty-text="暂无路径参数"
          />
        </TabsContent>

        <TabsContent value="query" class="mt-4">
          <ParamTable
            :params="queryParams"
            empty-text="暂无查询参数"
          />
        </TabsContent>

        <TabsContent value="headers" class="mt-4">
          <ParamTable
            :params="headers"
            empty-text="暂无请求头"
          />
        </TabsContent>
      </Tabs>
    </div>

    <div
      v-else
      class="text-center py-8 text-muted-foreground text-sm border rounded-md bg-muted/30"
    >
      该接口没有请求参数
    </div>
  </div>
</template>
