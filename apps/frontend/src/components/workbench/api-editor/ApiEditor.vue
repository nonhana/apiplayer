<script lang="ts" setup>
import type { TabPageItem } from '@/types'
import type { ApiDetail } from '@/types/api'
import { useRouteParams, useRouteQuery } from '@vueuse/router'
import { AlertCircle, FileText, GitBranch, Loader2, Pencil, Play, Settings2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { apiApi } from '@/api/api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ApiRunnerView from '../api-runner/ApiRunnerView.vue'
import VersionHistory from '../version/VersionHistory.vue'
import ApiDocView from './ApiDocView.vue'
import ApiEditView from './ApiEditView.vue'
import ApiSettingsView from './ApiSettingsView.vue'

type TabType = 'doc' | 'edit' | 'run' | 'versions' | 'settings'
const tabItems: TabPageItem<TabType>[] = [
  { value: 'doc', label: '文档', icon: FileText },
  { value: 'edit', label: '编辑', icon: Pencil },
  { value: 'run', label: '运行', icon: Play },
  { value: 'versions', label: '版本', icon: GitBranch },
  { value: 'settings', label: '设置', icon: Settings2 },
]

const projectId = useRouteParams<string>('projectId')
const apiId = useRouteParams<string>('apiId')

const activeTab = useRouteQuery<TabType>('mode', 'doc')
const editing = useRouteQuery('editing')

watch(activeTab, (newV, oldV) => {
  if (newV !== oldV && oldV === 'edit' && editing.value) {
    editing.value = undefined
  }
})

const apiDetail = ref<ApiDetail | null>(null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

const isLoaded = computed(() => apiDetail.value !== null)

async function fetchApiDetail() {
  isLoading.value = true
  loadError.value = null
  try {
    apiDetail.value = await apiApi.getApiDetail(projectId.value, apiId.value)
  }
  catch (error) {
    console.error('获取 API 详情失败:', error)
    loadError.value = `获取 API 详情失败: ${error}`
  }
  finally {
    isLoading.value = false
  }
}

async function refreshApiDetail() {
  loadError.value = null
  try {
    apiDetail.value = await apiApi.getApiDetail(projectId.value, apiId.value)
  }
  catch (error) {
    console.error('获取 API 详情失败:', error)
    loadError.value = `获取 API 详情失败: ${error}`
  }
}

// apiId 和 projectId 变化，刷新 API 详情
watch([apiId, projectId], ([curApiId, curProjectId]) => {
  if (curApiId && curProjectId) {
    fetchApiDetail()
  }
}, { immediate: true })
</script>

<template>
  <div class="h-full bg-background">
    <div
      v-if="isLoading"
      class="flex-1 flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 class="h-8 w-8 animate-spin" />
        <span class="text-sm">加载中...</span>
      </div>
    </div>

    <div
      v-else-if="loadError"
      class="flex-1 flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-destructive">
        <AlertCircle class="h-8 w-8" />
        <span class="text-sm">{{ loadError }}</span>
      </div>
    </div>

    <Tabs
      v-else-if="isLoaded && apiDetail"
      v-model="activeTab"
      class="flex-1 flex flex-col h-full"
    >
      <div class="border-b px-4 py-2 bg-muted/20">
        <TabsList class="h-10 bg-transparent p-0 gap-1">
          <TabsTrigger
            v-for="tab in tabItems"
            :key="tab.value"
            :value="tab.value"
            :disabled="tab.disabled"
            class="gap-1.5 px-3 data-[state=active]:text-primary"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </TabsTrigger>
        </TabsList>
      </div>

      <ScrollArea class="flex-1 overflow-y-auto">
        <TabsContent value="doc">
          <ApiDocView :api="apiDetail" />
        </TabsContent>

        <TabsContent value="edit">
          <ApiEditView :api="apiDetail" @updated="refreshApiDetail" />
        </TabsContent>

        <TabsContent value="run">
          <ApiRunnerView :api="apiDetail" />
        </TabsContent>

        <TabsContent value="versions">
          <VersionHistory
            :project-id="projectId"
            :api-id="apiId"
            :current-version-id="apiDetail.currentVersionId"
            @version-changed="refreshApiDetail"
          />
        </TabsContent>

        <TabsContent value="settings">
          <ApiSettingsView :api="apiDetail" />
        </TabsContent>
      </ScrollArea>
    </Tabs>

    <div
      v-else
      class="flex-1 flex items-center justify-center text-muted-foreground"
    >
      <span class="text-sm">无法加载接口信息</span>
    </div>
  </div>
</template>
