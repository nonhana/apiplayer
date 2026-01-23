import type { ApiBaseInfoForm, ApiReqData, LocalApiRequestBody, LocalApiResItem } from '@/components/workbench/api-editor/editor/types'
import type { ApiDetail, ApiParam, ParamCategory, UpdateApiReq } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import type { VersionChangeType } from '@/types/version'
import { cloneDeep, isEqual } from 'lodash-es'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { apiApi } from '@/api/api'
import { toApiReqBody, toApiResList, toLocalReqBody, toLocalResList } from '@/lib/api-editor'
import { genRootSchemaNode } from '@/lib/json-schema'
import { extractPathParamNames } from '@/lib/utils'
import { apiEditorDataSchema } from '@/validators/api'
import { useApiTreeStore } from './useApiTreeStore'
import { useTabStore } from './useTabStore'

/** 单个 API 的编辑器数据 */
export interface ApiEditorData {
  basicInfo: ApiBaseInfoForm
  paramsData: ApiReqData
  requestBody: LocalApiRequestBody | null
  responses: LocalApiResItem[]
}

/** 单个 API 的编辑缓存（包含数据、原始快照、脏状态） */
interface ApiEditorCache {
  data: ApiEditorData
  originalData: ApiEditorData | null
  isDirty: boolean
}

/** 创建空的编辑器数据 */
function createEmptyEditorData(): ApiEditorData {
  return {
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
  }
}

/** 创建空的编辑缓存 */
function createEmptyCache(): ApiEditorCache {
  return {
    data: createEmptyEditorData(),
    originalData: null,
    isDirty: false,
  }
}

export const useApiEditorStore = defineStore('apiEditor', () => {
  // ========== 核心状态 ==========

  /** 当前编辑的 API ID */
  const currentApiId = ref<string | null>(null)

  /** 所有 API 的编辑缓存 Map（key 为 apiId） */
  const editorCacheMap = ref<Record<string, ApiEditorCache>>({})

  /** 是否正在保存 */
  const isSaving = ref(false)

  // ========== 当前 API 的缓存访问 ==========

  /** 获取当前 API 的缓存（如果不存在则创建空缓存） */
  function getCurrentCache(): ApiEditorCache {
    if (!currentApiId.value) {
      return createEmptyCache()
    }
    let cache = editorCacheMap.value[currentApiId.value]
    if (!cache) {
      cache = createEmptyCache()
      editorCacheMap.value[currentApiId.value] = cache
    }
    return cache
  }

  /** 获取指定 API 的缓存 */
  function getCache(apiId: string): ApiEditorCache | undefined {
    return editorCacheMap.value[apiId]
  }

  // ========== 计算属性（保持接口不变，子组件无需修改） ==========

  /** 当前 API 的编辑器数据 */
  const data = computed(() => getCurrentCache().data)

  /** 当前 API 是否有未保存的修改 */
  const isDirty = computed(() => getCurrentCache().isDirty)

  /** 基本信息 */
  const basicInfo = computed(() => data.value.basicInfo)

  /** 请求参数 */
  const paramsData = computed(() => data.value.paramsData)

  /** 请求体 */
  const requestBody = computed(() => data.value.requestBody)

  /** 响应列表 */
  const responses = computed(() => data.value.responses)

  /** 当前 API 路径 */
  const currentPath = computed(() => data.value.basicInfo.path)

  // ========== 脏状态管理 ==========

  /** 标记当前 API 为已修改 */
  function markDirty() {
    if (!currentApiId.value)
      return
    const cache = getCurrentCache()
    cache.isDirty = true
  }

  /** 设置当前 API 的脏状态 */
  function setIsDirty(dirty: boolean) {
    if (!currentApiId.value)
      return
    const cache = getCurrentCache()
    cache.isDirty = dirty
  }

  // ========== 缓存管理方法 ==========

  /**
   * 检查指定 API 是否有未保存的修改
   * @param apiId API ID
   */
  function hasUnsavedChanges(apiId: string): boolean {
    const cache = editorCacheMap.value[apiId]
    return cache?.isDirty ?? false
  }

  /**
   * 清除指定 API 的编辑缓存
   * @param apiId API ID
   */
  function clearCache(apiId: string) {
    delete editorCacheMap.value[apiId]
  }

  /**
   * 放弃指定 API 的修改，恢复原始数据
   * @param apiId API ID
   */
  function discardChanges(apiId: string) {
    const cache = editorCacheMap.value[apiId]
    if (cache?.originalData) {
      cache.data = cloneDeep(cache.originalData)
      cache.isDirty = false
    }
  }

  /**
   * 切换到指定 API（仅切换 currentApiId）
   * @param apiId API ID
   */
  function switchToApi(apiId: string) {
    currentApiId.value = apiId
  }

  // ========== 初始化方法 ==========

  /**
   * 从 API 详情初始化编辑器
   * - 如果该 API 已有脏数据，跳过初始化（保留用户编辑）
   * - 否则从 API 详情创建新缓存
   * @param api API 详情
   */
  function initFromApi(api: ApiDetail) {
    const apiId = api.id
    currentApiId.value = apiId

    // 如果已有脏数据，跳过初始化（保留用户编辑）
    const existingCache = editorCacheMap.value[apiId]
    if (existingCache?.isDirty) {
      return
    }

    // 构建编辑器数据
    const editorData: ApiEditorData = {
      basicInfo: {
        name: api.name,
        method: api.method,
        path: api.path,
        status: api.status,
        tags: [...api.tags],
        description: api.description,
        ownerId: api.owner?.id,
      },
      paramsData: cloneDeep({
        pathParams: api.pathParams,
        queryParams: api.queryParams,
        requestHeaders: api.requestHeaders,
      }),
      requestBody: api.requestBody ? toLocalReqBody(api.requestBody) : null,
      responses: toLocalResList(api.responses ?? []),
    }

    // 创建缓存
    editorCacheMap.value[apiId] = {
      data: editorData,
      originalData: cloneDeep(editorData),
      isDirty: false,
    }

    // 同步路径参数
    syncPathParams(editorData.basicInfo.path)
  }

  /** 重置编辑器（清除当前 API 状态，不清除缓存） */
  function reset() {
    currentApiId.value = null
    isSaving.value = false
  }

  /** 完全重置（清除所有缓存） */
  function resetAll() {
    currentApiId.value = null
    editorCacheMap.value = {}
    isSaving.value = false
  }

  // ========== 参数操作 ==========

  /** 添加参数 */
  function addParam(category: ParamCategory) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    const newParam: ApiParam = {
      id: nanoid(),
      name: '',
      type: 'string',
      required: false,
      description: '',
      defaultValue: '',
      example: '',
    }

    switch (category) {
      case 'request-query':
        cache.data.paramsData.queryParams.push(newParam)
        break
      case 'request-header':
        cache.data.paramsData.requestHeaders.push(newParam)
        break
      case 'request-body':
        cache.data.requestBody?.formFields?.push(newParam)
        break
    }
    markDirty()
  }

  /** 删除参数 */
  function removeParam(category: ParamCategory, index: number) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    switch (category) {
      case 'request-query':
        cache.data.paramsData.queryParams.splice(index, 1)
        break
      case 'request-header':
        cache.data.paramsData.requestHeaders.splice(index, 1)
        break
      case 'request-body':
        cache.data.requestBody?.formFields?.splice(index, 1)
        break
    }
    markDirty()
  }

  /** 更新参数 */
  function updateParam<K extends keyof ApiParam>(category: ParamCategory, index: number, key: K, value: ApiParam[K]) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    let targetList: ApiParam[] | undefined

    switch (category) {
      case 'request-query':
        targetList = cache.data.paramsData.queryParams
        break
      case 'request-header':
        targetList = cache.data.paramsData.requestHeaders
        break
      case 'request-body':
        targetList = cache.data.requestBody?.formFields
        break
    }

    const target = targetList?.[index]
    if (target) {
      target[key] = value
      markDirty()
    }
  }

  // ========== 基本信息更新 ==========

  /** 更新基本信息字段 */
  function updateBasicInfo<K extends keyof ApiBaseInfoForm>(key: K, value: ApiBaseInfoForm[K]) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    cache.data.basicInfo[key] = value
    markDirty()

    // 如果更新的是路径，同步路径参数
    if (key === 'path') {
      syncPathParams(value as string)
    }
  }

  /** 批量更新基本信息 */
  function setBasicInfo(info: ApiBaseInfoForm) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    const oldPath = cache.data.basicInfo.path
    cache.data.basicInfo = { ...info }
    markDirty()

    // 如果路径变了，同步路径参数
    if (oldPath !== info.path) {
      syncPathParams(info.path)
    }
  }

  // ========== 请求参数更新 ==========

  /** 同步路径参数（根据 path 自动提取） */
  function syncPathParams(path: string) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    const extractedNames = extractPathParamNames(path)

    // 获取现有参数的映射
    const existingMap = new Map<string, ApiParam>()
    for (const param of cache.data.paramsData.pathParams) {
      existingMap.set(param.name, param)
    }

    // 根据提取的参数名生成新列表
    const curPathParams = extractedNames.map((name) => {
      const existing = existingMap.get(name)
      if (existing) {
        return { ...existing, required: true }
      }
      return {
        name,
        type: 'string',
        required: true,
        description: '',
        example: '',
      }
    })

    const hasChanged
      = curPathParams.length !== cache.data.paramsData.pathParams.length
        || curPathParams.some((p, i) => p.name !== cache.data.paramsData.pathParams[i]?.name)

    if (hasChanged) {
      const newPathParams = curPathParams.map(p => ({
        ...p,
        id: nanoid(),
      })) as ApiParam[]
      cache.data.paramsData.pathParams = newPathParams
    }
  }

  /** 更新路径参数 */
  function updatePathParams(params: ApiParam[]) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    cache.data.paramsData.pathParams = params
    markDirty()
  }

  // ========== 请求体更新 ==========

  /** 更新请求体 */
  function updateRequestBody(body: LocalApiRequestBody | null) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    cache.data.requestBody = body
    markDirty()
  }

  /** 更新请求体类型 */
  function updateRequestBodyType(type: LocalApiRequestBody['type']) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    if (!cache.data.requestBody) {
      cache.data.requestBody = {
        type,
        formFields: [],
        rawContentType: 'text/plain',
        description: '',
      }
    }

    const prevType = cache.data.requestBody.type
    cache.data.requestBody.type = type

    // 根据类型初始化默认值
    if (type === 'json' && !cache.data.requestBody.jsonSchema) {
      cache.data.requestBody.jsonSchema = genRootSchemaNode()
    }
    if ((type === 'form-data' || type === 'x-www-form-urlencoded') && !cache.data.requestBody.formFields) {
      cache.data.requestBody.formFields = []
    }

    // form-data -> x-www-form-urlencoded：重置 file 类型
    if (prevType === 'form-data' && type === 'x-www-form-urlencoded' && cache.data.requestBody.formFields) {
      cache.data.requestBody.formFields.forEach((field) => {
        if (field.type === 'file')
          field.type = 'string'
      })
    }
    markDirty()
  }

  /** 更新请求体 JSON Schema */
  function updateRequestBodySchema(schema: LocalSchemaNode) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    if (cache.data.requestBody) {
      cache.data.requestBody.jsonSchema = schema
      markDirty()
    }
  }

  /** 更新请求体描述 */
  function updateRequestBodyDescription(description: string) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    if (cache.data.requestBody) {
      cache.data.requestBody.description = description
      markDirty()
    }
  }

  // ========== 响应列表更新 ==========

  /** 添加响应 */
  function addResponse() {
    if (!currentApiId.value)
      return ''

    const cache = getCurrentCache()
    const newResponse: LocalApiResItem = {
      id: nanoid(),
      name: '成功响应',
      httpStatus: 200,
      description: '',
      body: genRootSchemaNode(),
    }
    cache.data.responses.push(newResponse)
    markDirty()
    return newResponse.id
  }

  /** 删除响应 */
  function removeResponse(index: number) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    cache.data.responses.splice(index, 1)
    markDirty()
  }

  /** 更新响应字段 */
  function updateResponseField<K extends keyof LocalApiResItem>(
    index: number,
    key: K,
    value: LocalApiResItem[K],
  ) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    const response = cache.data.responses[index]
    if (response) {
      response[key] = value
      markDirty()
    }
  }

  /** 更新响应体 Schema */
  function updateResponseBody(index: number, schema: LocalSchemaNode) {
    if (!currentApiId.value)
      return

    const cache = getCurrentCache()
    const response = cache.data.responses[index]
    if (response) {
      response.body = schema
      // 注意：JsonSchemaEditor 内部已经调用了 markDirty，这里不重复调用
    }
  }

  // ========== 保存逻辑 ==========

  /** 检查当前 API 是否有真正的变更 */
  function hasRealChanges(): boolean {
    if (!currentApiId.value)
      return false

    const cache = getCurrentCache()
    if (!cache.originalData)
      return true

    return (
      !isEqual(cache.originalData.basicInfo, cache.data.basicInfo)
      || !isEqual(cache.originalData.paramsData, cache.data.paramsData)
      || !isEqual(cache.originalData.requestBody, cache.data.requestBody)
      || !isEqual(cache.originalData.responses, cache.data.responses)
    )
  }

  /** 计算变更类型 */
  function computeChanges(): VersionChangeType[] {
    if (!currentApiId.value)
      return ['BASIC_INFO']

    const cache = getCurrentCache()
    if (!cache.originalData) {
      return ['BASIC_INFO']
    }

    const changes: VersionChangeType[] = []

    if (!isEqual(cache.originalData.basicInfo, cache.data.basicInfo)) {
      changes.push('BASIC_INFO')
    }
    if (!isEqual(cache.originalData.paramsData, cache.data.paramsData)) {
      changes.push('REQUEST_PARAM')
    }
    if (!isEqual(cache.originalData.requestBody, cache.data.requestBody)) {
      changes.push('REQUEST_BODY')
    }
    if (!isEqual(cache.originalData.responses, cache.data.responses)) {
      changes.push('RESPONSE')
    }

    return changes.length > 0 ? changes : ['BASIC_INFO']
  }

  /** 构建更新请求 */
  function buildUpdateRequest(): UpdateApiReq {
    const cache = getCurrentCache()
    const req: UpdateApiReq = {}

    req.baseInfo = {
      name: cache.data.basicInfo.name,
      method: cache.data.basicInfo.method,
      path: cache.data.basicInfo.path,
      status: cache.data.basicInfo.status,
      description: cache.data.basicInfo.description,
      tags: cache.data.basicInfo.tags,
      ownerId: cache.data.basicInfo.ownerId,
    }

    const reqBody = cache.data.requestBody ? toApiReqBody(cache.data.requestBody) : undefined
    const reqResList = toApiResList(cache.data.responses)

    req.coreInfo = {
      requestHeaders: cache.data.paramsData.requestHeaders,
      pathParams: cache.data.paramsData.pathParams,
      queryParams: cache.data.paramsData.queryParams,
      requestBody: reqBody,
      responses: reqResList,
    }

    req.versionInfo = {
      changes: computeChanges(),
    }

    return req
  }

  /** 验证表单 */
  function validate(): { valid: boolean, message?: string, path?: string } {
    const cache = getCurrentCache()
    const { success, error } = apiEditorDataSchema.safeParse(cache.data)
    if (!success) {
      const firstError = error.errors[0]
      const firstPath = String(firstError?.path[0])
      return { valid: false, message: firstError?.message ?? '验证失败', path: firstPath }
    }
    return { valid: true }
  }

  /**
   * 保存 API
   * @param projectId 项目 ID
   * @returns 是否保存成功
   */
  async function save(projectId: string): Promise<boolean> {
    if (!currentApiId.value || isSaving.value)
      return false

    const validation = validate()
    if (!validation.valid) {
      toast.error(validation.message ?? '验证失败')
      return false
    }

    if (!hasRealChanges()) {
      toast.info('没有检测到变更，无需保存')
      setIsDirty(false)
      return true
    }

    isSaving.value = true

    try {
      const req = buildUpdateRequest()
      await apiApi.updateApi(projectId, currentApiId.value, req)

      const apiTreeStore = useApiTreeStore()
      await apiTreeStore.refreshTree()

      const tabStore = useTabStore()
      const cache = getCurrentCache()
      tabStore.updateTabTitle(currentApiId.value, cache.data.basicInfo.name)

      toast.success('保存成功')

      // 更新原始数据快照
      cache.originalData = cloneDeep(cache.data)
      cache.isDirty = false

      return true
    }
    catch (error) {
      console.error('保存失败:', error)
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  return {
    // 状态
    currentApiId,
    editorCacheMap,
    data,
    isDirty,
    isSaving,

    // 计算属性
    basicInfo,
    paramsData,
    requestBody,
    responses,
    currentPath,

    // 缓存管理
    hasUnsavedChanges,
    clearCache,
    discardChanges,
    switchToApi,
    getCache,

    // 通用方法
    initFromApi,
    reset,
    resetAll,
    addParam,
    removeParam,
    updateParam,

    // 脏状态
    markDirty,
    setIsDirty,

    // 基本信息
    updateBasicInfo,
    setBasicInfo,

    // 请求参数
    syncPathParams,
    updatePathParams,

    // 请求体
    updateRequestBody,
    updateRequestBodyType,
    updateRequestBodySchema,
    updateRequestBodyDescription,

    // 响应
    addResponse,
    removeResponse,
    updateResponseField,
    updateResponseBody,

    // 保存
    validate,
    save,
  }
}, {
  persist: {
    storage: sessionStorage,
  },
})
