<script lang="ts" setup>
import type { TabPageItem } from '@/types'
import { AlertCircle, Clock, Code, FileText, Loader2, Settings } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import CurlGenerator from './response/CurlGenerator.vue'
import ResponseBody from './response/ResponseBody.vue'
import ResponseHeaders from './response/ResponseHeaders.vue'

const runnerStore = useApiRunnerStore()

type ResponseTab = 'body' | 'headers' | 'curl'

const activeTab = ref<ResponseTab>('body')

const tabItems: TabPageItem<ResponseTab>[] = [
  { value: 'body', label: 'Body', icon: FileText },
  { value: 'headers', label: 'Headers', icon: Settings },
  { value: 'curl', label: 'cURL', icon: Code },
]

/** 状态码颜色 */
const statusColor = computed(() => {
  const status = runnerStore.response?.status
  if (!status)
    return ''

  if (status >= 200 && status < 300)
    return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
  if (status >= 300 && status < 400)
    return 'bg-blue-500/15 text-blue-600 border-blue-500/30'
  if (status >= 400 && status < 500)
    return 'bg-amber-500/15 text-amber-600 border-amber-500/30'
  if (status >= 500)
    return 'bg-rose-500/15 text-rose-600 border-rose-500/30'

  return 'bg-gray-500/15 text-gray-600 border-gray-500/30'
})

/** 格式化大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
</script>

<template>
  <div class="flex flex-col h-full border rounded-lg bg-card">
    <div class="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
      <h3 class="text-sm font-medium">
        响应结果
      </h3>

      <div v-if="runnerStore.response" class="flex items-center gap-3 text-sm">
        <Badge :class="statusColor">
          {{ runnerStore.response.status }} {{ runnerStore.response.statusText }}
        </Badge>

        <div class="flex items-center gap-1 text-muted-foreground">
          <Clock class="h-3.5 w-3.5" />
          <span>{{ runnerStore.response.duration }}ms</span>
        </div>

        <div class="text-muted-foreground">
          {{ formatSize(runnerStore.response.size) }}
        </div>
      </div>
    </div>

    <div class="min-h-60 flex-1 overflow-hidden">
      <div
        v-if="runnerStore.isLoading"
        class="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <Loader2 class="h-8 w-8 animate-spin" />
        <span class="text-sm">请求中...</span>
      </div>

      <div
        v-else-if="runnerStore.status === 'error'"
        class="h-full flex flex-col items-center justify-center gap-3 text-destructive"
      >
        <AlertCircle class="h-8 w-8" />
        <span class="text-sm">{{ runnerStore.errorMessage ?? '请求失败' }}</span>
      </div>

      <div
        v-else-if="runnerStore.status === 'idle'"
        class="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <Code class="h-8 w-8" />
        <span class="text-sm">点击「发送请求」获取响应</span>
      </div>

      <Tabs
        v-else
        v-model="activeTab"
        class="h-full flex flex-col"
      >
        <TabsList class="bg-transparent m-2">
          <TabsTrigger
            v-for="tab in tabItems"
            :key="tab.value"
            :value="tab.value"
            class="gap-1.5 px-3 data-[state=active]:text-primary"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>

        <div class="flex-1 overflow-hidden">
          <TabsContent value="body" class="h-full mt-0">
            <ResponseBody />
          </TabsContent>

          <TabsContent value="headers" class="h-full mt-0">
            <ResponseHeaders />
          </TabsContent>

          <TabsContent value="curl" class="h-full mt-0">
            <CurlGenerator />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  </div>
</template>
