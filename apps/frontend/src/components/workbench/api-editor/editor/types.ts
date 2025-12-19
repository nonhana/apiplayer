import type { ApiParam, ApiStatus, HttpMethod } from '@/types/api'

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
