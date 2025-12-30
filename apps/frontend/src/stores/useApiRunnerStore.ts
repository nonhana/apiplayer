import type { ApiDetail, ApiParam, HttpMethod, RequestBodyType } from '@/types/api'
import type { ProjectEnv } from '@/types/project'
import type { AuthType, CurlOptions, ProxyResponse, RunnerStatus, RuntimeAuth, RuntimeBody, RuntimeParam } from '@/types/proxy'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { proxyApi } from '@/api/proxy'
import { useProjectStore } from './useProjectStore'

export const useApiRunnerStore = defineStore('apiRunner', () => {
  // ========== 状态 ==========

  /** 当前选中的环境 ID */
  const selectedEnvId = ref<string | null>(null)

  /** 当前 API 的方法 */
  const method = ref<HttpMethod>('GET')

  /** 当前 API 的路径 */
  const path = ref<string>('')

  /** 路径参数 */
  const pathParams = ref<RuntimeParam[]>([])

  /** 查询参数 */
  const queryParams = ref<RuntimeParam[]>([])

  /** 请求头 */
  const headers = ref<RuntimeParam[]>([])

  /** 请求体 */
  const body = ref<RuntimeBody>({ type: 'none' })

  /** 认证配置 */
  const auth = ref<RuntimeAuth>({ type: 'none' })

  /** 响应数据 */
  const response = ref<ProxyResponse | null>(null)

  /** 请求状态 */
  const status = ref<RunnerStatus>('idle')

  /** 错误信息 */
  const errorMessage = ref<string | null>(null)

  // ========== 计算属性 ==========

  /** 当前选中的环境 */
  const selectedEnv = computed<ProjectEnv | null>(() => {
    const projectStore = useProjectStore()
    const envs = projectStore.projectDetail?.environments ?? []
    return envs.find(e => e.id === selectedEnvId.value) ?? null
  })

  /** 环境列表 */
  const environments = computed<ProjectEnv[]>(() => {
    const projectStore = useProjectStore()
    return projectStore.projectDetail?.environments ?? []
  })

  /** 完整的请求 URL */
  const fullUrl = computed<string>(() => {
    const baseUrl = selectedEnv.value?.baseUrl ?? ''
    let resultPath = path.value

    // 替换路径参数
    for (const param of pathParams.value) {
      if (param.enabled && param.value) {
        resultPath = resultPath.replace(`{${param.name}}`, encodeURIComponent(param.value))
      }
    }

    // 构建查询字符串
    const enabledQueryParams = queryParams.value.filter(p => p.enabled && p.name)
    if (enabledQueryParams.length > 0) {
      const searchParams = new URLSearchParams()
      for (const param of enabledQueryParams) {
        searchParams.append(param.name, param.value)
      }
      resultPath += `?${searchParams.toString()}`
    }

    return `${baseUrl}${resultPath}`
  })

  /** 构建请求头对象 */
  const headersRecord = computed<Record<string, string>>(() => {
    const result: Record<string, string> = {}

    // 添加启用的自定义请求头
    for (const header of headers.value) {
      if (header.enabled && header.name) {
        result[header.name] = header.value
      }
    }

    // 添加认证头
    if (auth.value.type === 'bearer' && auth.value.bearerToken) {
      result.Authorization = `Bearer ${auth.value.bearerToken}`
    }
    else if (auth.value.type === 'basic' && auth.value.basicUsername) {
      const credentials = btoa(`${auth.value.basicUsername}:${auth.value.basicPassword ?? ''}`)
      result.Authorization = `Basic ${credentials}`
    }

    return result
  })

  /** 请求体内容和类型 */
  const bodyContent = computed<{ content?: string, contentType?: string }>(() => {
    switch (body.value.type) {
      case 'json':
        return {
          content: body.value.jsonContent ?? '',
          contentType: 'application/json',
        }
      case 'form-data': {
        // form-data 需要特殊处理，这里先返回 JSON 形式
        const formParams = body.value.formData?.filter(p => p.enabled) ?? []
        const formObj: Record<string, string> = {}
        for (const p of formParams) {
          formObj[p.name] = p.value
        }
        return {
          content: JSON.stringify(formObj),
          contentType: 'multipart/form-data',
        }
      }
      case 'x-www-form-urlencoded': {
        const params = body.value.formData?.filter(p => p.enabled) ?? []
        const searchParams = new URLSearchParams()
        for (const p of params) {
          searchParams.append(p.name, p.value)
        }
        return {
          content: searchParams.toString(),
          contentType: 'application/x-www-form-urlencoded',
        }
      }
      case 'raw':
        return {
          content: body.value.rawContent ?? '',
          contentType: 'text/plain',
        }
      default:
        return {}
    }
  })

  /** 生成的 cURL 命令 */
  const curlCommand = computed<string>(() => {
    const options: CurlOptions = {
      url: fullUrl.value,
      method: method.value,
      headers: headersRecord.value,
      body: bodyContent.value.content,
    }
    return generateCurl(options)
  })

  /** 是否正在加载 */
  const isLoading = computed(() => status.value === 'loading')

  // ========== Actions ==========

  /**
   * 从 API 定义初始化运行时状态
   * @param api API 详情
   */
  function initFromApiDetail(api: ApiDetail) {
    // 重置状态
    reset()

    // 设置方法和路径
    method.value = api.method
    path.value = api.path

    // 初始化路径参数
    pathParams.value = api.pathParams.map(p => convertToRuntimeParam(p, true))

    // 初始化查询参数
    queryParams.value = api.queryParams.map(p => convertToRuntimeParam(p, true))

    // 初始化请求头
    headers.value = api.requestHeaders.map(p => convertToRuntimeParam(p, true))

    // 初始化请求体
    if (api.requestBody) {
      body.value = {
        type: api.requestBody.type as RuntimeBody['type'],
        jsonContent: api.requestBody.type === 'json'
          ? JSON.stringify(api.requestBody.example ?? {}, null, 2)
          : undefined,
        formData: api.requestBody.formFields?.map(f => convertToRuntimeParam(f, true)),
        rawContent: '',
      }
    }
    else {
      body.value = { type: 'none' }
    }

    // 设置默认环境
    const projectStore = useProjectStore()
    const defaultEnv = projectStore.projectDetail?.environments?.find(e => e.isDefault)
    if (defaultEnv) {
      selectedEnvId.value = defaultEnv.id
    }
    else {
      const firstEnv = environments.value[0]
      if (firstEnv) {
        selectedEnvId.value = firstEnv.id
      }
    }
  }

  /**
   * 发送请求
   */
  async function sendRequest() {
    if (status.value === 'loading')
      return

    // 检查环境
    if (!selectedEnvId.value) {
      errorMessage.value = '请先选择一个环境'
      status.value = 'error'
      return
    }

    status.value = 'loading'
    errorMessage.value = null
    response.value = null

    try {
      const result = await proxyApi.sendRequest({
        url: fullUrl.value,
        method: method.value,
        headers: headersRecord.value,
        body: bodyContent.value.content,
        contentType: bodyContent.value.contentType,
        timeout: 30000,
      })

      response.value = result
      status.value = 'success'
    }
    catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '请求失败'
      status.value = 'error'
    }
  }

  /**
   * 重置所有状态
   */
  function reset() {
    selectedEnvId.value = null
    method.value = 'GET'
    path.value = ''
    pathParams.value = []
    queryParams.value = []
    headers.value = []
    body.value = { type: 'none' }
    auth.value = { type: 'none' }
    response.value = null
    status.value = 'idle'
    errorMessage.value = null
  }

  /**
   * 清除响应
   */
  function clearResponse() {
    response.value = null
    status.value = 'idle'
    errorMessage.value = null
  }

  // ========== 参数操作 ==========

  /** 添加查询参数 */
  function addQueryParam() {
    queryParams.value.push(createEmptyRuntimeParam())
  }

  /** 删除查询参数 */
  function removeQueryParam(index: number) {
    queryParams.value.splice(index, 1)
  }

  /** 添加请求头 */
  function addHeader() {
    headers.value.push(createEmptyRuntimeParam())
  }

  /** 删除请求头 */
  function removeHeader(index: number) {
    headers.value.splice(index, 1)
  }

  /** 添加表单字段 */
  function addFormField() {
    if (!body.value.formData) {
      body.value.formData = []
    }
    body.value.formData.push(createEmptyRuntimeParam())
  }

  /** 删除表单字段 */
  function removeFormField(index: number) {
    body.value.formData?.splice(index, 1)
  }

  // ========== Setters ==========

  function setSelectedEnvId(id: string | null) {
    selectedEnvId.value = id
  }

  function setBodyType(type: RequestBodyType) {
    body.value.type = type
    // 初始化对应类型的数据
    if (type === 'json' && !body.value.jsonContent) {
      body.value.jsonContent = '{}'
    }
    if ((type === 'form-data' || type === 'x-www-form-urlencoded') && !body.value.formData) {
      body.value.formData = []
    }
  }

  function setJsonContent(content: string) {
    body.value.jsonContent = content
  }

  function setRawContent(content: string) {
    body.value.rawContent = content
  }

  function setAuthType(type: AuthType) {
    auth.value.type = type
  }

  function setBearerToken(token: string) {
    auth.value.bearerToken = token
  }

  function setBasicAuth(username: string, password: string) {
    auth.value.basicUsername = username
    auth.value.basicPassword = password
  }

  return {
    // 状态
    selectedEnvId,
    method,
    path,
    pathParams,
    queryParams,
    headers,
    body,
    auth,
    response,
    status,
    errorMessage,

    // 计算属性
    selectedEnv,
    environments,
    fullUrl,
    headersRecord,
    bodyContent,
    curlCommand,
    isLoading,

    // Actions
    initFromApiDetail,
    sendRequest,
    reset,
    clearResponse,

    // 参数操作
    addQueryParam,
    removeQueryParam,
    addHeader,
    removeHeader,
    addFormField,
    removeFormField,

    // Setters
    setSelectedEnvId,
    setBodyType,
    setJsonContent,
    setRawContent,
    setAuthType,
    setBearerToken,
    setBasicAuth,
  }
})

// ========== 工具函数 ==========

/** 将 API 参数转换为运行时参数 */
function convertToRuntimeParam(param: ApiParam, fromDefinition: boolean): RuntimeParam {
  return {
    id: nanoid(),
    name: param.name,
    value: param.example ?? param.defaultValue ?? '',
    enabled: true,
    fromDefinition,
    type: param.type,
    description: param.description,
  }
}

/** 创建空的运行时参数 */
function createEmptyRuntimeParam(): RuntimeParam {
  return {
    id: nanoid(),
    name: '',
    value: '',
    enabled: true,
    fromDefinition: false,
  }
}

/** 生成 cURL 命令 */
function generateCurl(options: CurlOptions): string {
  const parts: string[] = [`curl -X ${options.method}`]

  // 添加 URL（需要转义特殊字符）
  parts.push(`'${options.url}'`)

  // 添加 Headers
  for (const [key, value] of Object.entries(options.headers)) {
    parts.push(`-H '${key}: ${value}'`)
  }

  // 添加 Body
  if (options.body && !['GET', 'HEAD'].includes(options.method)) {
    // 转义单引号
    const escapedBody = options.body.replace(/'/g, `'\\''`)
    parts.push(`-d '${escapedBody}'`)
  }

  return parts.join(' \\\n  ')
}
