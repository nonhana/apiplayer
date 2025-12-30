import type { HttpMethod } from './api'

/** 代理请求参数 */
export interface ProxyRequest {
  /** 完整的目标 URL */
  url: string
  /** HTTP 方法 */
  method: HttpMethod
  /** 请求头（可选） */
  headers?: Record<string, string>
  /** 请求体（已序列化为字符串，可选） */
  body?: string
  /** Content-Type 类型（可选） */
  contentType?: string
  /** 请求超时时间，单位：毫秒（可选，默认 30000，范围 1000-120000） */
  timeout?: number
}

/** 代理响应结果 */
export interface ProxyResponse {
  /** HTTP 状态码 */
  status: number
  /** HTTP 状态文本 */
  statusText: string
  /** 响应头 */
  headers: Record<string, string>
  /** 响应体（字符串形式） */
  body: string
  /** 请求耗时（毫秒） */
  duration: number
  /** 响应体大小（字节） */
  size: number
}

/** 运行时参数项（带启用状态） */
export interface RuntimeParam {
  /** 唯一标识 */
  id: string
  /** 参数名 */
  name: string
  /** 参数值 */
  value: string
  /** 是否启用 */
  enabled: boolean
  /** 是否来自 API 定义（不可删除名称） */
  fromDefinition: boolean
  /** 参数类型（只读展示） */
  type?: string
  /** 参数描述（只读展示） */
  description?: string
}

/** 请求体运行时数据 */
export interface RuntimeBody {
  /** 请求体类型 */
  type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'binary' | 'raw'
  /** JSON 字符串内容（json 类型） */
  jsonContent?: string
  /** 表单数据（form-data / x-www-form-urlencoded） */
  formData?: RuntimeParam[]
  /** 原始内容（raw 类型） */
  rawContent?: string
  /** 二进制文件（binary 类型） */
  binaryFile?: File
}

/** 认证类型 */
export type AuthType = 'none' | 'bearer' | 'basic'

/** 运行时认证配置 */
export interface RuntimeAuth {
  /** 认证类型 */
  type: AuthType
  /** Bearer Token */
  bearerToken?: string
  /** Basic Auth 用户名 */
  basicUsername?: string
  /** Basic Auth 密码 */
  basicPassword?: string
}

/** API Runner 请求状态 */
export type RunnerStatus = 'idle' | 'loading' | 'success' | 'error'

/** cURL 生成选项 */
export interface CurlOptions {
  /** 目标 URL */
  url: string
  /** HTTP 方法 */
  method: HttpMethod
  /** 请求头 */
  headers: Record<string, string>
  /** 请求体 */
  body?: string
}
