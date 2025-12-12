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
  ownerId: string
  editorId: string
  creatorId: string
  createdAt: string
  updatedAt: string
  description?: string
  status: ApiStatus
  requestHeaders: Record<string, unknown>[]
  pathParams: Record<string, unknown>[]
  queryParams: Record<string, unknown>[]
  requestBody?: Record<string, unknown>
  responses: Record<string, unknown>[]
  examples: Record<string, unknown>
  mockConfig?: Record<string, unknown>
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
  requestHeaders?: Record<string, unknown>[]
  pathParams?: Record<string, unknown>[]
  queryParams?: Record<string, unknown>[]
  requestBody?: Record<string, unknown>
  responses?: { name: string, httpStatus: number, body: Record<string, unknown> }[]
  examples?: Record<string, unknown>
  mockConfig?: Record<string, unknown>
  ownerId?: string
}

/** 更新 API 请求 */
export interface UpdateApiReq {
  baseInfo?: {
    name?: string
    method?: HttpMethod
    path?: string
    description?: string
    tags?: string[]
    status?: ApiStatus
    sortOrder?: number
    ownerId?: string
  }
  coreInfo?: {
    requestHeaders?: Record<string, unknown>[]
    pathParams?: Record<string, unknown>[]
    queryParams?: Record<string, unknown>[]
    requestBody?: Record<string, unknown>
    responses?: Record<string, unknown>[]
    examples?: Record<string, unknown>
    mockConfig?: Record<string, unknown>
  }
  versionInfo?: {
    version?: string
    summary?: string
    changelog?: string
    changes?: string[]
  }
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
