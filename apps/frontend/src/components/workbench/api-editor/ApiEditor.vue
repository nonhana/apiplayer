<script lang="ts" setup>
import type { TabPageItem } from '@/types'
import type { ApiDetail } from '@/types/api'
import { useRouteParams, useRouteQuery } from '@vueuse/router'
import { AlertCircle, FileText, Loader2, Pencil, Play, Settings2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { apiApi } from '@/api/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ApiDocView from './ApiDocView.vue'
import ApiEditView from './ApiEditView.vue'

const projectId = useRouteParams<string>('projectId')
const apiId = useRouteParams<string>('apiId')

/** 监听 API ID 和项目 ID 变化，重新获取 API 详情 */
watch([apiId, projectId], ([curApiId, curProjectId]) => {
  if (curApiId && curProjectId) {
    fetchApiDetail()
  }
}, { immediate: true })

type TabType = 'doc' | 'edit' | 'run' | 'settings'
const tabItems: TabPageItem<TabType>[] = [
  { value: 'doc', label: '文档', icon: FileText },
  { value: 'edit', label: '编辑', icon: Pencil },
  { value: 'run', label: '运行', icon: Play, disabled: true },
  { value: 'settings', label: '设置', icon: Settings2, disabled: true },
]

const activeTab = useRouteQuery<TabType>('mode', 'doc')
const editing = useRouteQuery('editing')

watch(activeTab, (newV, oldV) => {
  if (newV !== oldV && oldV === 'edit' && editing.value) {
    editing.value = undefined
  }
})

/** API 详情数据 */
const apiDetail = ref<ApiDetail | null>(null)

/** 加载状态 */
const isLoading = ref(false)

/** 加载错误 */
const loadError = ref<string | null>(null)

/** 是否已加载 */
const isLoaded = computed(() => apiDetail.value !== null)

/** 获取 API 详情 */
async function fetchApiDetail() {
  isLoading.value = true
  loadError.value = null

  try {
    const data = await apiApi.getApiDetail(projectId.value, apiId.value)
    apiDetail.value = data
  }
  catch (err) {
    loadError.value = `获取 API 详情失败: ${err}`
  }
  finally {
    isLoading.value = false
  }
}

/** 处理 API 更新成功 */
function handleApiUpdated(updatedApi: ApiDetail) {
  apiDetail.value = updatedApi
}
</script>

<template>
  <div class="h-full flex flex-col bg-background">
    <!-- 加载状态 -->
    <div
      v-if="isLoading"
      class="flex-1 flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 class="h-8 w-8 animate-spin" />
        <span class="text-sm">加载中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="loadError"
      class="flex-1 flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-destructive">
        <AlertCircle class="h-8 w-8" />
        <span class="text-sm">{{ loadError }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <Tabs
      v-else-if="isLoaded && apiDetail"
      v-model="activeTab"
      class="flex-1 flex flex-col overflow-hidden"
    >
      <!-- Tab 切换 -->
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

      <!-- Tab 内容 -->
      <TabsContent value="doc" class="flex-1 mt-0 overflow-hidden">
        <ApiDocView :api="apiDetail" />
      </TabsContent>

      <TabsContent value="edit" class="flex-1 mt-0 overflow-hidden">
        <ApiEditView :api="apiDetail" @updated="handleApiUpdated" />
      </TabsContent>

      <TabsContent value="run" class="flex-1 mt-0 overflow-hidden">
        <div class="h-full flex items-center justify-center text-muted-foreground">
          <span>运行功能开发中...</span>
        </div>
      </TabsContent>

      <TabsContent value="settings" class="flex-1 mt-0 overflow-hidden">
        <div class="h-full flex items-center justify-center text-muted-foreground">
          <span>设置功能开发中...</span>
        </div>
      </TabsContent>
    </Tabs>

    <!-- 空状态 -->
    <div
      v-else
      class="flex-1 flex items-center justify-center text-muted-foreground"
    >
      <span class="text-sm">无法加载接口信息</span>
    </div>
  </div>
</template>
