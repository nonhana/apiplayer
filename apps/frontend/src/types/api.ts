import type { LocalSchemaNode } from './json-schema'
import type { UserBriefInfo } from './user'

/** 标签页类型 */
export type TabType = 'api' | 'overview' | 'settings' | 'schema' | 'group'

/** 标签页数据结构 */
export interface Tab {
  /** 唯一标识（API ID 或其他标识） */
  id: string
  /** 显示标题 */
  title: string
  /** 标签类型 */
  type: TabType
  /** HTTP 方法（仅 API 类型） */
  method?: HttpMethod
  /** 路径（仅 API 类型） */
  path?: string
  /** 是否有未保存的修改 */
  dirty?: boolean
  /** 是否固定 */
  pinned?: boolean
  /** 附加数据 */
  data?: unknown
}

/** HTTP 请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/** API 状态 */
export type ApiStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'DELETED'

/** 参数类型 */
export type ParamType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'file'

/** API 参数定义（请求头/路径参数/查询参数通用） */
export interface ApiParam {
  /** 参数名 */
  name: string
  /** 参数类型 */
  type: ParamType
  /** 是否必填 */
  required?: boolean
  /** 参数描述 */
  description?: string
  /** 默认值 */
  defaultValue?: string
  /** 示例值 */
  example?: string
  /** 枚举值（可选） */
  enum?: string[]
  /** 最小长度 */
  minLength?: number
  /** 最大长度 */
  maxLength?: number
  /** 格式（如 email, uri, date-time 等） */
  format?: string
}

/** 请求体类型 */
export type RequestBodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'raw'

/** 请求体定义 */
export interface ApiRequestBody {
  /** 内容类型 */
  type: RequestBodyType
  /** JSON Schema（用于 json 类型） */
  jsonSchema?: Record<string, unknown>
  /** 表单字段（用于 form-data / x-www-form-urlencoded） */
  formFields?: ApiParam[]
  /** 原始内容类型（用于 raw） */
  rawContentType?: string
  /** 示例数据 */
  example?: unknown
  /** 描述 */
  description?: string
}

/** 本地请求体定义 */
export interface LocalApiRequestBody extends Omit<ApiRequestBody, 'jsonSchema'> {
  /** 本地 JSON Schema */
  jsonSchema?: LocalSchemaNode
}

/** 响应定义 */
export interface ApiResItem {
  /** 唯一标识 */
  id: string
  /** 响应名称 */
  name: string
  /** HTTP 状态码 */
  httpStatus: number
  /** 响应体 Schema */
  body?: Record<string, unknown>
  /** 响应描述 */
  description?: string
  /** 响应头 */
  headers?: ApiParam[]
  /** 示例数据 */
  example?: unknown
}

/** 本地响应定义 */
export interface LocalApiResItem extends Omit<ApiResItem, 'body'> {
  /** 本地响应体 Schema */
  body?: LocalSchemaNode
}

/** Mock 配置 */
export interface ApiMockConfig {
  /** 是否启用 Mock */
  enabled?: boolean
  /** Mock 响应延迟（毫秒） */
  delay?: number
  /** 自定义 Mock 规则 */
  rules?: Record<string, unknown>
}

/** API 简要信息（用于列表展示） */
export interface ApiBrief {
  id: string
  name: string
  method: HttpMethod
  path: string
  sortOrder: number
}

/** API 详情信息 */
export interface ApiDetail extends ApiBrief {
  tags: string[]
  owner: UserBriefInfo | null
  editor: UserBriefInfo
  creator: UserBriefInfo
  createdAt: string
  updatedAt: string
  description?: string
  status: ApiStatus
  requestHeaders: ApiParam[]
  pathParams: ApiParam[]
  queryParams: ApiParam[]
  requestBody?: ApiRequestBody
  responses: ApiResItem[]
  examples: Record<string, unknown>
  mockConfig?: ApiMockConfig
}

/** 分组简要信息 */
export interface GroupBrief {
  id: string
  name: string
  parentId?: string
  description?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/** 分组节点（用于树形结构展示） */
export interface GroupNode {
  id: string
  name: string
  sortOrder: number
  children: GroupNode[]
  apiCount: number
}

/** 分组节点（含 API 列表） */
export interface GroupNodeWithApis extends GroupNode {
  apis: ApiBrief[]
  children: GroupNodeWithApis[]
}

/** 树形结构的扁平节点（用于内部处理） */
export interface TreeNodeFlat {
  id: string
  name: string
  type: 'group' | 'api'
  parentId?: string
  sortOrder: number
  /** API 专属字段 */
  method?: HttpMethod
  path?: string
}

// ========== 请求参数类型 ==========

/** 获取分组树（含 API）请求参数 */
export interface GetGroupTreeWithApisReq {
  subtreeRootId?: string
  maxDepth?: number
  includeCurrentVersion?: boolean
  apiMethod?: HttpMethod
  apiStatus?: ApiStatus
  search?: string
  apiLimitPerGroup?: number
}

/** 创建分组请求 */
export interface CreateGroupReq {
  name: string
  parentId?: string
  description?: string
  sortOrder?: number
}

/** 更新分组请求 */
export interface UpdateGroupReq {
  name?: string
  description?: string
  sortOrder?: number
}

/** 移动分组请求 */
export interface MoveGroupReq {
  newParentId?: string | null
  sortOrder?: number
}

/** 删除分组请求 */
export interface DeleteGroupReq {
  cascade?: boolean
}

/** 创建 API 请求 */
export interface CreateApiReq {
  groupId: string
  name: string
  path: string
  method: HttpMethod
  description?: string
  tags?: string[]
  sortOrder?: number
  version?: string
  summary?: string
  status?: ApiStatus
  requestHeaders?: ApiParam[]
  pathParams?: ApiParam[]
  queryParams?: ApiParam[]
  requestBody?: ApiRequestBody
  responses?: ApiResItem[]
  examples?: Record<string, unknown>
  mockConfig?: ApiMockConfig
  ownerId?: string
}

/** 更新 API 基本信息 */
export interface UpdateApiBaseInfo {
  name?: string
  method?: HttpMethod
  path?: string
  description?: string
  tags?: string[]
  status?: ApiStatus
  sortOrder?: number
  ownerId?: string
}

/** 更新 API 核心信息 */
export interface UpdateApiCoreInfo {
  requestHeaders?: ApiParam[]
  pathParams?: ApiParam[]
  queryParams?: ApiParam[]
  requestBody?: ApiRequestBody
  responses?: ApiResItem[]
  examples?: Record<string, unknown>
  mockConfig?: ApiMockConfig
}

/** 更新 API 版本信息 */
export interface UpdateApiVersionInfo {
  version?: string
  summary?: string
  changelog?: string
  changes?: string[]
}

/** 更新 API 请求 */
export interface UpdateApiReq {
  baseInfo?: UpdateApiBaseInfo
  coreInfo?: UpdateApiCoreInfo
  versionInfo?: UpdateApiVersionInfo
}

/** 克隆 API 请求 */
export interface CloneApiReq {
  targetGroupId: string
  name?: string
  path?: string
  method?: HttpMethod
}

/** 排序项 */
export interface SortItem {
  id: string
  sortOrder: number
}

/** 批量排序请求 */
export interface SortItemsReq {
  items: SortItem[]
}

/** 移动 API 到分组请求 */
export interface MoveApiReq {
  targetGroupId: string
  sortOrder?: number
}
