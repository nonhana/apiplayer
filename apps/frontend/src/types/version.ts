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
  /** 版本 ID */
  id: string
  /** 修订号，自增 */
  revision: number
  /** 版本号，用户发布时填写 */
  version?: string
  /** 版本状态 */
  status: VersionStatus
  /** 版本摘要 */
  summary?: string
  /** 变更日志 */
  changelog?: string
  /** 变更类型 */
  changes: VersionChangeType[]
  /** 编辑者 ID */
  editorId: string
  /** API ID */
  apiId: string
  /** 项目 ID */
  projectId: string
  /** 发布时间 */
  publishedAt?: string
  /** 创建时间 */
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
    summary?: string
    changelog?: string
    changes?: VersionChangeType[]
  }
}

/** 发布版本请求 */
export interface PublishVersionReq {
  /** 版本号，格式：vX.X.X */
  version: string
  /** 版本摘要（可选） */
  summary?: string
  /** 变更日志（可选） */
  changelog?: string
}
