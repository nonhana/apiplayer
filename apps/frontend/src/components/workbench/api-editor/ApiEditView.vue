<script lang="ts" setup>
import type { TabPageItem } from '@/types'
import type { ApiDetail } from '@/types/api'
import { useRouteQuery } from '@vueuse/router'
import { FileText, Hash, Loader2, MessageSquare, Save, Settings } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApiEditorStore } from '@/stores/useApiEditorStore'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import BasicInfoEditor from './editor/BasicInfoEditor.vue'
import ParamsEditor from './editor/ParamsEditor.vue'
import RequestBodyEditor from './editor/RequestBodyEditor.vue'
import ResponsesEditor from './editor/ResponsesEditor.vue'

const props = defineProps<{
  api: ApiDetail
}>()

const emits = defineEmits<{
  (e: 'updated'): void
}>()

type TabType = 'basicInfo' | 'paramsData' | 'requestBody' | 'responses'
const tabItems: TabPageItem<TabType>[] = [
  { value: 'basicInfo', label: '基本信息', icon: Settings },
  { value: 'paramsData', label: '请求参数', icon: Hash },
  { value: 'requestBody', label: '请求体', icon: FileText },
  { value: 'responses', label: '响应定义', icon: MessageSquare },
]

const apiTreeStore = useApiTreeStore()

const apiEditorStore = useApiEditorStore()
const { isDirty, isSaving, basicInfo } = storeToRefs(apiEditorStore)

const activeTab = useRouteQuery<TabType>('editing', 'basicInfo')

watch(
  () => props.api.id,
  () => {
    if (props.api) {
      apiEditorStore.initFromApi(props.api)
    }
  },
  { immediate: true },
)

function handleDiscardChanges() {
  apiEditorStore.discardChanges(props.api.id)
}

async function handleSave() {
  if (!apiTreeStore.projectId)
    return

  // 验证失败时切换到对应 Tab
  const result = apiEditorStore.validate()
  if (!result.valid && result.path) {
    activeTab.value = result.path as TabType
    toast.error(result.message ?? '验证失败')
    return
  }

  const success = await apiEditorStore.save(apiTreeStore.projectId)

  success && emits('updated')
}

// 监测到 Cmd/Ctrl + S 时，触发保存
function handleKeyDownSave(e: KeyboardEvent) {
  const isSaveShortcut = (e.ctrlKey || e.metaKey) && e.code === 'KeyS'
  if (isSaveShortcut) {
    e.preventDefault()
    handleSave()
  }
}
</script>

<template>
  <div class="h-full flex flex-col" tabindex="0" @keydown="handleKeyDownSave">
    <div class="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-medium text-muted-foreground">
          编辑接口
        </h2>
        <Separator orientation="vertical" class="h-4" />
        <span class="text-sm font-semibold truncate max-w-75">
          {{ basicInfo.name || '未命名接口' }}
        </span>
        <span
          v-if="isDirty"
          class="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded"
        >
          未保存
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          v-if="isDirty"
          size="sm"
          variant="outline"
          @click="handleDiscardChanges"
        >
          放弃修改
        </Button>

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
    </div>

    <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
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

      <ScrollArea class="flex-1">
        <div class="w-full p-6">
          <TabsContent value="basicInfo" class="mt-0">
            <BasicInfoEditor />
          </TabsContent>

          <TabsContent value="paramsData" class="mt-0">
            <ParamsEditor />
          </TabsContent>

          <TabsContent value="requestBody" class="mt-0">
            <RequestBodyEditor />
          </TabsContent>

          <TabsContent value="responses" class="mt-0">
            <ResponsesEditor />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  </div>
</template>
