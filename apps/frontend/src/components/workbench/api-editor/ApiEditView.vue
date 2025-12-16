<script lang="ts" setup>
import type { ApiBaseInfoForm, ApiReqData } from './editor/types'
import type { ApiDetail, ApiParam, ApiRequestBody, ApiResponse, UpdateApiReq } from '@/types/api'
import { FileText, Hash, Loader2, MessageSquare, Save, Settings } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { apiApi } from '@/api/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const apiTreeStore = useApiTreeStore()
const tabStore = useTabStore()

/** 当前激活的 Tab */
const activeTab = ref('basic')

/** 是否正在保存 */
const isSaving = ref(false)

/** 基本信息 */
const basicInfo = ref<ApiBaseInfoForm>({
  name: '',
  method: 'GET',
  path: '',
  status: 'DRAFT',
  description: '',
  tags: [],
  ownerId: '',
})

/** 请求参数 */
const paramsData = ref<ApiReqData>({
  pathParams: [],
  queryParams: [],
  requestHeaders: [],
})

/** 请求体 */
const requestBody = ref<ApiRequestBody | null>(null)

/** 响应定义 */
const responses = ref<ApiResponse[]>([])

/** 原始数据（用于检测变化） */
const originalData = ref<string>('')

/** 从 API 详情初始化数据 */
function initFromApi(api: ApiDetail) {
  basicInfo.value = {
    name: api.name,
    method: api.method,
    path: api.path,
    status: api.status,
    description: api.description ?? '',
    tags: api.tags ?? [],
    ownerId: api.owner?.id ?? '',
  }

  paramsData.value = {
    pathParams: (api.pathParams ?? []) as ApiParam[],
    queryParams: (api.queryParams ?? []) as ApiParam[],
    requestHeaders: (api.requestHeaders ?? []) as ApiParam[],
  }

  requestBody.value = api.requestBody ?? null

  responses.value = (api.responses ?? []) as ApiResponse[]

  // 保存原始数据快照
  originalData.value = JSON.stringify({
    basicInfo: basicInfo.value,
    paramsData: paramsData.value,
    requestBody: requestBody.value,
    responses: responses.value,
  })
}

/** 监听 API 变化 */
watch(
  () => props.api,
  (newApi) => {
    if (newApi) {
      initFromApi(newApi)
    }
  },
  { immediate: true, deep: true },
)

/** 当前数据快照 */
const currentDataSnapshot = computed(() => {
  return JSON.stringify({
    basicInfo: basicInfo.value,
    paramsData: paramsData.value,
    requestBody: requestBody.value,
    responses: responses.value,
  })
})

/** 是否有未保存的修改 */
const hasChanges = computed(() => {
  return currentDataSnapshot.value !== originalData.value
})

/** 监听变化，更新 Tab 的 dirty 状态 */
watch(hasChanges, (dirty) => {
  tabStore.setTabDirty(props.api.id, dirty)
})

/** 构建更新请求 */
function buildUpdateRequest(): UpdateApiReq {
  const req: UpdateApiReq = {}

  // 基本信息
  req.baseInfo = {
    name: basicInfo.value.name,
    method: basicInfo.value.method,
    path: basicInfo.value.path,
    status: basicInfo.value.status,
    description: basicInfo.value.description || undefined,
    tags: basicInfo.value.tags,
    ownerId: basicInfo.value.ownerId,
  }

  // 核心信息
  req.coreInfo = {
    requestHeaders: paramsData.value.requestHeaders as Record<string, unknown>[],
    pathParams: paramsData.value.pathParams as Record<string, unknown>[],
    queryParams: paramsData.value.queryParams as Record<string, unknown>[],
    requestBody: requestBody.value as Record<string, unknown> | undefined,
    responses: responses.value as Record<string, unknown>[],
  }

  return req
}

/** 保存 API */
async function handleSave() {
  if (!apiTreeStore.projectId || !props.api.id)
    return

  // 验证必填字段
  if (!basicInfo.value.name.trim()) {
    toast.error('请输入接口名称')
    activeTab.value = 'basic'
    return
  }

  if (!basicInfo.value.path.trim()) {
    toast.error('请输入接口路径')
    activeTab.value = 'basic'
    return
  }

  isSaving.value = true

  try {
    const req = buildUpdateRequest()
    await apiApi.updateApi(apiTreeStore.projectId, props.api.id, req)

    // 更新原始数据快照
    originalData.value = currentDataSnapshot.value

    // 刷新树
    await apiTreeStore.refreshTree()

    // 更新 Tab 标题
    tabStore.updateTabTitle(props.api.id, basicInfo.value.name)

    toast.success('保存成功')

    // 通知父组件
    emit('updated', {
      ...props.api,
      ...basicInfo.value,
      requestHeaders: paramsData.value.requestHeaders,
      pathParams: paramsData.value.pathParams,
      queryParams: paramsData.value.queryParams,
      requestBody: requestBody.value ?? undefined,
      responses: responses.value,
    })
  }
  catch (error) {
    console.error('保存失败:', error)
    toast.error('保存失败，请稍后重试')
  }
  finally {
    isSaving.value = false
  }
}

/** Tab 配置 */
const tabItems = [
  { value: 'basic', label: '基本信息', icon: Settings },
  { value: 'params', label: '请求参数', icon: Hash },
  { value: 'body', label: '请求体', icon: FileText },
  { value: 'responses', label: '响应定义', icon: MessageSquare },
]
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
          v-if="hasChanges"
          class="text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded"
        >
          未保存
        </span>
      </div>

      <Button
        size="sm"
        :disabled="!hasChanges || isSaving"
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
            <BasicInfoEditor
              :info="basicInfo"
              @update:info="basicInfo = $event"
            />
          </TabsContent>

          <!-- 请求参数 -->
          <TabsContent value="params" class="mt-0">
            <ParamsEditor
              :params="paramsData"
              :path="basicInfo.path"
              @update:params="paramsData = $event"
            />
          </TabsContent>

          <!-- 请求体 -->
          <TabsContent value="body" class="mt-0">
            <RequestBodyEditor
              :body="requestBody"
              @update:body="requestBody = $event"
            />
          </TabsContent>

          <!-- 响应定义 -->
          <TabsContent value="responses" class="mt-0">
            <ResponsesEditor
              :responses="responses"
              @update:responses="responses = $event"
            />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  </div>
</template>
