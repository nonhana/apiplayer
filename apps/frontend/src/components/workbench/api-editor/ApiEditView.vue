<script lang="ts" setup>
import type { TabPageItem } from '@/types'
import type { ApiDetail } from '@/types/api'
import { useRouteQuery } from '@vueuse/router'
import { FileText, Hash, Loader2, MessageSquare, Save, Settings } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useTabStore } from '@/stores/useTabStore'
import BasicInfoEditor from './editor/BasicInfoEditor.vue'
import ParamsEditor from './editor/ParamsEditor.vue'
import RequestBodyEditor from './editor/RequestBodyEditor.vue'
import ResponsesEditor from './editor/ResponsesEditor.vue'

const props = defineProps<{
  api: ApiDetail
}>()

const emit = defineEmits<{
  (e: 'updated', api: ApiDetail): void
}>()

type TabType = 'basic' | 'params' | 'body' | 'responses'
const tabItems: TabPageItem<TabType>[] = [
  { value: 'basic', label: '基本信息', icon: Settings },
  { value: 'params', label: '请求参数', icon: Hash },
  { value: 'body', label: '请求体', icon: FileText },
  { value: 'responses', label: '响应定义', icon: MessageSquare },
]

const apiTreeStore = useApiTreeStore()
const apiEditorStore = useApiEditorStore()
const tabStore = useTabStore()
const activeTab = useRouteQuery<TabType>('editing', 'basic')

const { isDirty, isSaving, basicInfo } = storeToRefs(apiEditorStore)

/** 监听 API 变化，初始化编辑器 */
watch(
  () => props.api,
  (newApi) => {
    if (newApi) {
      apiEditorStore.initFromApi(newApi)
    }
  },
  { immediate: true, deep: true },
)

/** 监听脏状态变化，更新 Tab 标记 */
watch(isDirty, (dirty) => {
  tabStore.setTabDirty(props.api.id, dirty)
})

/** 保存 API */
async function handleSave() {
  if (!apiTreeStore.projectId)
    return

  // 验证失败时切换到对应 Tab
  const validation = apiEditorStore.validate()
  if (!validation.valid && validation.field) {
    activeTab.value = validation.field as TabType
    return
  }

  const success = await apiEditorStore.save(apiTreeStore.projectId)

  if (success) {
    // 通知父组件更新本地数据
    emit('updated', {
      ...props.api,
      ...apiEditorStore.getUpdatedApiDetail(),
    })
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-medium text-muted-foreground">
          编辑接口
        </h2>
        <Separator orientation="vertical" class="h-4" />
        <span class="text-sm font-semibold truncate max-w-[300px]">
          {{ basicInfo.name || '未命名接口' }}
        </span>
        <span
          v-if="isDirty"
          class="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded"
        >
          未保存
        </span>
      </div>

      <Button
        size="sm"
        :disabled="!isDirty || isSaving"
        @click="handleSave"
      >
        <Loader2 v-if="isSaving" class="h-4 w-4 mr-1.5 animate-spin" />
        <Save v-else class="h-4 w-4 mr-1.5" />
        {{ isSaving ? '保存中...' : '保存' }}
      </Button>
    </div>

    <!-- 编辑区域 -->
    <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
      <!-- Tab 导航 -->
      <div class="border-b px-4 py-2 bg-background">
        <TabsList class="h-10 bg-transparent p-0 gap-1">
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
      </div>

      <!-- Tab 内容 -->
      <ScrollArea class="flex-1">
        <div class="w-full p-6">
          <!-- 基本信息 -->
          <TabsContent value="basic" class="mt-0">
            <BasicInfoEditor />
          </TabsContent>

          <!-- 请求参数 -->
          <TabsContent value="params" class="mt-0">
            <ParamsEditor />
          </TabsContent>

          <!-- 请求体 -->
          <TabsContent value="body" class="mt-0">
            <RequestBodyEditor />
          </TabsContent>

          <!-- 响应定义 -->
          <TabsContent value="responses" class="mt-0">
            <ResponsesEditor />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  </div>
</template>
