import type { ApiParam, ApiRequestBody, ApiResItem, ApiStatus, HttpMethod } from '@/types/api'
import type { LocalSchemaNode } from '@/types/json-schema'

/** API 基本信息表单项 */
export interface ApiBaseInfoForm {
  // 必填
  name: string
  method: HttpMethod
  path: string
  status: ApiStatus
  tags: string[]
  // 可选
  description?: string
  ownerId?: string
}

export interface ApiReqData {
  pathParams: ApiParam[]
  queryParams: ApiParam[]
  requestHeaders: ApiParam[]
}

/** 本地请求体定义 */
export interface LocalApiRequestBody extends Omit<ApiRequestBody, 'jsonSchema'> {
  /** 本地 JSON Schema */
  jsonSchema?: LocalSchemaNode
}

/** 本地响应定义 */
export interface LocalApiResItem extends Omit<ApiResItem, 'body'> {
  /** 本地响应体 Schema */
  body?: LocalSchemaNode
}
