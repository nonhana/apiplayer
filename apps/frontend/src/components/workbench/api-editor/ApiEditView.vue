<script lang="ts" setup>
import type { ApiBaseInfoForm, ApiReqData } from './editor/types'
import type { TabPageItem } from '@/types'
import type { ApiDetail, ApiRequestBody, LocalApiRequestBody, LocalApiResponse, UpdateApiReq } from '@/types/api'
import { useRouteQuery } from '@vueuse/router'
import { FileText, Hash, Loader2, MessageSquare, Save, Settings } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { apiApi } from '@/api/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { nodeToSchema, schemaToNode } from '@/lib/json-schema'
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

const { isDirty } = storeToRefs(apiEditorStore)
const { setIsDirty } = apiEditorStore

/** 是否正在保存 */
const isSaving = ref(false)

const apiData = reactive<{
  basicInfo: ApiBaseInfoForm
  paramsData: ApiReqData
  requestBody: LocalApiRequestBody | null
  responses: LocalApiResponse[]
}>({
  basicInfo: {
    name: '',
    method: 'GET',
    path: '',
    status: 'DRAFT',
    tags: [],
  },
  paramsData: {
    pathParams: [],
    queryParams: [],
    requestHeaders: [],
  },
  requestBody: null,
  responses: [],
})

/** ApiRequestBody -> LocalApiRequestBody */
function toLocalReqBody(body: ApiRequestBody): LocalApiRequestBody {
  const { jsonSchema, ...rest } = body
  const result: LocalApiRequestBody = { ...rest }
  if (jsonSchema) {
    result.jsonSchema = schemaToNode(jsonSchema)
  }
  return result
}

/** LocalApiRequestBody -> ApiRequestBody */
function toApiReqBody(body: LocalApiRequestBody): ApiRequestBody {
  const { jsonSchema, ...rest } = body
  const result: ApiRequestBody = { ...rest }
  if (jsonSchema) {
    result.jsonSchema = nodeToSchema(jsonSchema)
  }
  return result
}

/** 从 API 详情初始化数据 */
function initFromApi(api: ApiDetail) {
  apiData.basicInfo = {
    name: api.name,
    method: api.method,
    path: api.path,
    status: api.status,
    tags: api.tags,
  }
  if (api.owner)
    apiData.basicInfo.ownerId = api.owner.id
  if (api.description)
    apiData.basicInfo.description = api.description

  apiData.paramsData = {
    pathParams: api.pathParams,
    queryParams: api.queryParams,
    requestHeaders: api.requestHeaders,
  }

  apiData.requestBody = api.requestBody ? toLocalReqBody(api.requestBody) : null

  apiData.responses = api.responses.map((response) => {
    const { body, ...rest } = response
    const res: LocalApiResponse = { ...rest }
    if (body) {
      res.body = schemaToNode(body)
    }
    return res
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

/** 监听变化，更新 Tab 的 dirty 状态 */
watch(isDirty, (dirty) => {
  tabStore.setTabDirty(props.api.id, dirty)
})

/** 构建更新请求 */
function buildUpdateRequest(): UpdateApiReq {
  const req: UpdateApiReq = {}

  // 基本信息
  req.baseInfo = {
    name: apiData.basicInfo.name,
    method: apiData.basicInfo.method,
    path: apiData.basicInfo.path,
    status: apiData.basicInfo.status,
    description: apiData.basicInfo.description,
    tags: apiData.basicInfo.tags,
    ownerId: apiData.basicInfo.ownerId,
  }

  // 处理请求体数据
  const reqBody = apiData.requestBody ? toApiReqBody(apiData.requestBody) : undefined

  // 核心信息
  req.coreInfo = {
    requestHeaders: apiData.paramsData.requestHeaders,
    pathParams: apiData.paramsData.pathParams,
    queryParams: apiData.paramsData.queryParams,
    requestBody: reqBody as (Record<string, unknown> | undefined),
    responses: apiData.responses,
  }

  return req
}

/** 保存 API */
async function handleSave() {
  if (!apiTreeStore.projectId || !props.api.id)
    return

  // 验证必填字段
  if (!apiData.basicInfo.name?.trim()) {
    toast.error('请输入接口名称')
    activeTab.value = 'basic'
    return
  }

  if (!apiData.basicInfo.path?.trim()) {
    toast.error('请输入接口路径')
    activeTab.value = 'basic'
    return
  }

  isSaving.value = true

  try {
    const req = buildUpdateRequest()
    await apiApi.updateApi(apiTreeStore.projectId, props.api.id, req)

    // 刷新树
    await apiTreeStore.refreshTree()

    // 更新 Tab 标题
    tabStore.updateTabTitle(props.api.id, apiData.basicInfo.name)

    toast.success('保存成功')

    // 通知父组件更新本地数据
    emit('updated', {
      ...props.api,
      ...apiData.basicInfo,
      requestHeaders: apiData.paramsData.requestHeaders,
      pathParams: apiData.paramsData.pathParams,
      queryParams: apiData.paramsData.queryParams,
      requestBody: apiData.requestBody ? toApiReqBody(apiData.requestBody) : undefined,
      responses: apiData.responses,
    })
  }
  catch (err) {
    console.error('保存失败:', err)
    toast.error('保存失败，请稍后重试')
  }
  finally {
    isSaving.value = false
    setIsDirty(false)
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
          {{ apiData.basicInfo.name || '未命名接口' }}
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
            <BasicInfoEditor
              :info="apiData.basicInfo"
              @update:info="apiData.basicInfo = $event; setIsDirty(true)"
            />
          </TabsContent>

          <!-- 请求参数 -->
          <TabsContent value="params" class="mt-0">
            <ParamsEditor
              :params="apiData.paramsData"
              :path="apiData.basicInfo.path"
              @update:params="apiData.paramsData = $event; setIsDirty(true)"
            />
          </TabsContent>

          <!-- 请求体 -->
          <TabsContent value="body" class="mt-0">
            <RequestBodyEditor
              :body="apiData.requestBody"
              @update:body="apiData.requestBody = $event; setIsDirty(true)"
            />
          </TabsContent>

          <!-- 响应定义 -->
          <TabsContent value="responses" class="mt-0">
            <ResponsesEditor
              :responses="apiData.responses"
              @update:responses="apiData.responses = $event; setIsDirty(true)"
            />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  </div>
</template>
