import type { ApiDetail, ApiParam, ApiRequestBody, ApiResItem, HttpMethod } from './api'

/** 版本状态 */
export type VersionStatus = 'DRAFT' | 'CURRENT' | 'ARCHIVED'

/** 版本变更类型 */
export type VersionChangeType
  = | 'BASIC_INFO'
    | 'REQUEST_PARAM'
    | 'REQUEST_BODY'
    | 'RESPONSE'
    | 'CREATE'
    | 'DELETE'
    | 'RESTORE'

/** API 版本简要信息 */
export interface ApiVersionBrief {
  id: string
  version: string
  status: VersionStatus
  summary?: string
  changelog?: string
  changes: VersionChangeType[]
  editorId: string
  apiId: string
  projectId: string
  publishedAt?: string
  createdAt: string
  /** 快照中的当前 API 状态 */
  apiStatus?: ApiDetail['status']
  /** 快照中的描述信息 */
  description?: string
}

/** API 版本详情（含快照数据） */
export interface ApiVersionDetail extends ApiVersionBrief {
  /** 快照中的名称 */
  name: string
  /** 快照中的请求方法 */
  method: HttpMethod
  /** 快照中的路径 */
  path: string
  /** 快照中的标签 */
  tags: string[]
  /** 快照中的排序字段 */
  sortOrder: number
  /** 请求头定义 */
  requestHeaders: ApiParam[]
  /** 路径参数定义 */
  pathParams: ApiParam[]
  /** 查询参数定义 */
  queryParams: ApiParam[]
  /** 请求体定义 */
  requestBody?: ApiRequestBody
  /** 响应定义 */
  responses: ApiResItem[]
  /** 示例数据 */
  examples: Record<string, unknown>
  /** Mock 配置 */
  mockConfig?: Record<string, unknown>
}

/** 版本列表响应 */
export interface ApiVersionsResponse {
  versions: ApiVersionBrief[]
}

/** 字段差异项 */
export interface DiffItem {
  from: unknown
  to: unknown
}

/** 版本比较响应 */
export interface ApiVersionComparison {
  from: ApiVersionDetail
  to: ApiVersionDetail
  diff: Record<string, DiffItem>
}

/** 创建版本请求 */
export interface CreateVersionReq {
  baseInfo?: {
    name?: string
    method?: HttpMethod
    path?: string
    description?: string
    tags?: string[]
    status?: ApiDetail['status']
    sortOrder?: number
  }
  coreInfo?: {
    requestHeaders?: ApiParam[]
    pathParams?: ApiParam[]
    queryParams?: ApiParam[]
    requestBody?: ApiRequestBody
    responses?: ApiResItem[]
    examples?: Record<string, unknown>
    mockConfig?: Record<string, unknown>
  }
  versionInfo?: {
    version?: string
    summary?: string
    changelog?: string
    changes?: VersionChangeType[]
  }
}
