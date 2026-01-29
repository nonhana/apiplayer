import type { HttpMethod } from './api'

/** 冲突处理策略 */
export type ConflictStrategy = 'skip' | 'overwrite' | 'rename'

/** OpenAPI 文档基本信息 */
export interface OpenApiInfo {
  /** 文档标题 */
  title: string
  /** 文档版本 */
  version: string
  /** 文档描述 */
  description?: string
}

/** 解析后的分组信息预览 */
export interface ParsedGroupPreview {
  /** 分组名称 */
  name: string
  /** 分组描述 */
  description?: string
  /** 该分组下的 API 数量 */
  apiCount: number
}

/** 解析后的 API 信息预览 */
export interface ParsedApiPreview {
  /** 请求路径 */
  path: string
  /** 请求方法 */
  method: HttpMethod
  /** API 名称 */
  name: string
  /** 所属分组名称 */
  groupName: string
  /** 描述 */
  description?: string
  /** 是否与现有 API 冲突 */
  hasConflict: boolean
  /** 冲突的现有 API ID */
  conflictApiId?: string
}

/** 统计信息 */
export interface ImportStats {
  /** 总 API 数量 */
  totalApis: number
  /** 新 API 数量 */
  newApis: number
  /** 冲突 API 数量 */
  conflictApis: number
}

/** 解析预览响应 */
export interface ImportPreview {
  /** OpenAPI 文档基本信息 */
  info: OpenApiInfo
  /** 分组列表 */
  groups: ParsedGroupPreview[]
  /** API 列表 */
  apis: ParsedApiPreview[]
  /** 统计信息 */
  stats: ImportStats
  /** 原始 OpenAPI 文档内容 */
  content: string
}

/** 解析 OpenAPI 请求参数 */
export interface ParseOpenapiReq {
  /** OpenAPI 文档内容 */
  content?: string
  /** OpenAPI 文档 URL */
  url?: string
}

/** 执行导入请求参数 */
export interface ExecuteImportReq {
  /** OpenAPI 文档内容 */
  content: string
  /** 冲突处理策略 */
  conflictStrategy: ConflictStrategy
  /** 目标分组ID */
  targetGroupId?: string
  /** 是否自动创建分组 */
  createMissingGroups?: boolean
}

/** 导入结果中的单个 API 信息 */
export interface ImportedApiResult {
  /** API 名称 */
  name: string
  /** 请求路径 */
  path: string
  /** 请求方法 */
  method: HttpMethod
  /** 导入状态 */
  status: 'created' | 'updated' | 'skipped' | 'failed'
  /** 失败原因 */
  error?: string
  /** 创建的 API ID */
  apiId?: string
}

/** 导入执行结果响应 */
export interface ImportResult {
  /** 是否成功 */
  success: boolean
  /** 导入的 API 结果列表 */
  results: ImportedApiResult[]
  /** 成功创建数量 */
  createdCount: number
  /** 成功更新数量 */
  updatedCount: number
  /** 跳过数量 */
  skippedCount: number
  /** 失败数量 */
  failedCount: number
  /** 创建的分组名称列表 */
  createdGroups: string[]
}

/** 导入步骤 */
export type ImportStep = 'upload' | 'preview' | 'result'

/** 上传方式 */
export type UploadMethod = 'file' | 'url' | 'paste'
