import type { ApiBaseInfoForm, ApiReqData, LocalApiRequestBody, LocalApiResItem } from '@/components/workbench/api-editor/editor/types'
import type { ApiDetail, ApiParam, ParamCategory, UpdateApiReq } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'
import { cloneDeep } from 'lodash-es'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { toast } from 'vue-sonner'
import { apiApi } from '@/api/api'
import { toApiReqBody, toApiResList, toLocalReqBody, toLocalResList } from '@/lib/api-editor'
import { genRootSchemaNode } from '@/lib/json-schema'
import { extractPathParamNames } from '@/lib/utils'
import { apiEditorDataSchema } from '@/validators/api'
import { useApiTreeStore } from './useApiTreeStore'
import { useTabStore } from './useTabStore'

export interface ApiEditorData {
  basicInfo: ApiBaseInfoForm
  paramsData: ApiReqData
  requestBody: LocalApiRequestBody | null
  responses: LocalApiResItem[]
}

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

export const useApiEditorStore = defineStore('apiEditor', () => {
  // ========== 状态 ==========

  /** 当前编辑的 API ID */
  const currentApiId = ref<string | null>(null)

  /** 原始 API 数据（用于对比是否有变更） */
  const originalApi = shallowRef<ApiDetail | null>(null)

  /** 编辑器数据 */
  const data = ref<ApiEditorData>(createEmptyEditorData())

  /** 是否有未保存的修改 */
  const isDirty = ref(false)

  /** 是否正在保存 */
  const isSaving = ref(false)

  // ========== 计算属性 ==========

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

  /** 标记为已修改 */
  function markDirty() {
    isDirty.value = true
  }

  /** 设置脏状态 */
  function setIsDirty(dirty: boolean) {
    isDirty.value = dirty
  }

  // ========== 通用方法 ==========
  /**
   * 从 API 详情初始化编辑器
   * @param api API 详情
   */
  function initFromApi(api: ApiDetail) {
    currentApiId.value = api.id
    originalApi.value = api

    // 基本信息
    data.value.basicInfo = {
      name: api.name,
      method: api.method,
      path: api.path,
      status: api.status,
      tags: [...api.tags],
      description: api.description,
      ownerId: api.owner?.id,
    }

    // 请求参数
    data.value.paramsData = {
      pathParams: cloneDeep(api.pathParams),
      queryParams: cloneDeep(api.queryParams),
      requestHeaders: cloneDeep(api.requestHeaders),
    }

    // 同步路径参数
    syncPathParams(data.value.basicInfo.path)

    // 请求体
    data.value.requestBody = api.requestBody ? toLocalReqBody(api.requestBody) : null

    // 响应列表
    data.value.responses = toLocalResList(api.responses ?? [])

    // 重置脏状态
    isDirty.value = false
  }

  /** 重置编辑器 */
  function reset() {
    currentApiId.value = null
    originalApi.value = null
    data.value = createEmptyEditorData()
    isDirty.value = false
    isSaving.value = false
  }

  /** 添加参数 */
  function addParam(category: ParamCategory) {
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
        data.value.paramsData.queryParams.push(newParam)
        break
      case 'request-header':
        data.value.paramsData.requestHeaders.push(newParam)
        break
      case 'request-body':
        data.value.requestBody?.formFields?.push(newParam)
        break
    }
    markDirty()
  }

  /** 删除参数 */
  function removeParam(category: ParamCategory, index: number) {
    switch (category) {
      case 'request-query':
        data.value.paramsData.queryParams.splice(index, 1)
        break
      case 'request-header':
        data.value.paramsData.requestHeaders.splice(index, 1)
        break
      case 'request-body':
        data.value.requestBody?.formFields?.splice(index, 1)
        break
    }
    markDirty()
  }

  /** 更新参数 */
  function updateParam<K extends keyof ApiParam>(category: ParamCategory, index: number, key: K, value: ApiParam[K]) {
    let targetList: ApiParam[] | undefined

    switch (category) {
      case 'request-query':
        targetList = data.value.paramsData.queryParams
        break
      case 'request-header':
        targetList = data.value.paramsData.requestHeaders
        break
      case 'request-body':
        targetList = data.value.requestBody?.formFields
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
    data.value.basicInfo[key] = value
    markDirty()

    // 如果更新的是路径，同步路径参数
    if (key === 'path') {
      syncPathParams(value as string)
    }
  }

  /** 批量更新基本信息 */
  function setBasicInfo(info: ApiBaseInfoForm) {
    const oldPath = data.value.basicInfo.path
    data.value.basicInfo = { ...info }
    markDirty()

    // 如果路径变了，同步路径参数
    if (oldPath !== info.path) {
      syncPathParams(info.path)
    }
  }

  // ========== 请求参数更新 ==========

  /** 同步路径参数（根据 path 自动提取） */
  function syncPathParams(path: string) {
    const extractedNames = extractPathParamNames(path)

    // 获取现有参数的映射
    const existingMap = new Map<string, ApiParam>()
    for (const param of data.value.paramsData.pathParams) {
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
      = curPathParams.length !== data.value.paramsData.pathParams.length
        // 如果 name 变化，说明用户为 path 参数赋予的语义不同了
        || curPathParams.some((p, i) => p.name !== data.value.paramsData.pathParams[i]?.name)

    if (hasChanged) {
      const newPathParams = curPathParams.map(p => ({
        ...p,
        id: nanoid(),
      })) as ApiParam[]
      data.value.paramsData.pathParams = newPathParams
    }
  }

  /** 更新路径参数 */
  function updatePathParams(params: ApiParam[]) {
    data.value.paramsData.pathParams = params
    markDirty()
  }

  // ========== 请求体更新 ==========

  /** 更新请求体 */
  function updateRequestBody(body: LocalApiRequestBody | null) {
    data.value.requestBody = body
    markDirty()
  }

  /** 更新请求体类型 */
  function updateRequestBodyType(type: LocalApiRequestBody['type']) {
    if (!data.value.requestBody) {
      data.value.requestBody = {
        type,
        formFields: [],
        rawContentType: 'text/plain',
        description: '',
      }
    }
    const prevType = data.value.requestBody.type
    data.value.requestBody.type = type

    // 根据类型初始化默认值
    if (type === 'json' && !data.value.requestBody.jsonSchema) {
      data.value.requestBody.jsonSchema = genRootSchemaNode()
    }
    if ((type === 'form-data' || type === 'x-www-form-urlencoded') && !data.value.requestBody.formFields) {
      data.value.requestBody.formFields = []
    }

    // form-data -> x-www-form-urlencoded：重置 file 类型
    if (prevType === 'form-data' && type === 'x-www-form-urlencoded' && data.value.requestBody.formFields) {
      data.value.requestBody.formFields.forEach((field) => {
        if (field.type === 'file')
          field.type = 'string'
      })
    }
    markDirty()
  }

  /** 更新请求体 JSON Schema */
  function updateRequestBodySchema(schema: LocalSchemaNode) {
    if (data.value.requestBody) {
      data.value.requestBody.jsonSchema = schema
      markDirty()
    }
  }

  /** 更新请求体描述 */
  function updateRequestBodyDescription(description: string) {
    if (data.value.requestBody) {
      data.value.requestBody.description = description
      markDirty()
    }
  }

  // ========== 响应列表更新 ==========

  /** 添加响应 */
  function addResponse() {
    const newResponse: LocalApiResItem = {
      id: nanoid(),
      name: '成功响应',
      httpStatus: 200,
      description: '',
      body: genRootSchemaNode(),
    }
    data.value.responses.push(newResponse)
    markDirty()
    return newResponse.id
  }

  /** 删除响应 */
  function removeResponse(index: number) {
    data.value.responses.splice(index, 1)
    markDirty()
  }

  /** 更新响应字段 */
  function updateResponseField<K extends keyof LocalApiResItem>(
    index: number,
    key: K,
    value: LocalApiResItem[K],
  ) {
    const response = data.value.responses[index]
    if (response) {
      response[key] = value
      markDirty()
    }
  }

  /** 更新响应体 Schema */
  function updateResponseBody(index: number, schema: LocalSchemaNode) {
    const response = data.value.responses[index]
    if (response) {
      response.body = schema
      // 注意：JsonSchemaEditor 内部已经调用了 markDirty，这里不重复调用
    }
  }

  // ========== 保存逻辑 ==========

  /** 构建更新请求 */
  function buildUpdateRequest(): UpdateApiReq {
    const req: UpdateApiReq = {}

    // 基本信息
    req.baseInfo = {
      name: data.value.basicInfo.name,
      method: data.value.basicInfo.method,
      path: data.value.basicInfo.path,
      status: data.value.basicInfo.status,
      description: data.value.basicInfo.description,
      tags: data.value.basicInfo.tags,
      ownerId: data.value.basicInfo.ownerId,
    }

    // 处理请求体
    const reqBody = data.value.requestBody ? toApiReqBody(data.value.requestBody) : undefined

    // 处理响应列表
    const reqResList = toApiResList(data.value.responses)

    // 核心信息
    req.coreInfo = {
      requestHeaders: data.value.paramsData.requestHeaders,
      pathParams: data.value.paramsData.pathParams,
      queryParams: data.value.paramsData.queryParams,
      requestBody: reqBody,
      responses: reqResList,
    }

    return req
  }

  /** 验证表单 */
  function validate(): { valid: boolean, message?: string, path?: string } {
    const { success, error } = apiEditorDataSchema.safeParse(data.value)
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

    // 验证
    const validation = validate()
    if (!validation.valid) {
      toast.error(validation.message ?? '验证失败')
      return false
    }

    isSaving.value = true

    try {
      const req = buildUpdateRequest()
      await apiApi.updateApi(projectId, currentApiId.value, req)

      // 刷新树
      const apiTreeStore = useApiTreeStore()
      await apiTreeStore.refreshTree()

      // 更新 Tab 标题
      const tabStore = useTabStore()
      tabStore.updateTabTitle(currentApiId.value, data.value.basicInfo.name)

      toast.success('保存成功')

      // 重置脏状态
      isDirty.value = false

      return true
    }
    catch (err) {
      console.error('保存失败:', err)
      toast.error('保存失败，请稍后重试')
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  return {
    // 状态
    currentApiId,
    originalApi,
    data,
    isDirty,
    isSaving,

    // 计算属性
    basicInfo,
    paramsData,
    requestBody,
    responses,
    currentPath,

    // 通用方法
    initFromApi,
    reset,
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
})
