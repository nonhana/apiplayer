import type { ApiParam, UpdateApiBaseInfo } from '@/types/api'

export type ApiBaseInfoForm = Required<Omit<UpdateApiBaseInfo, 'sortOrder'>>

export interface ApiReqData {
  pathParams: ApiParam[]
  queryParams: ApiParam[]
  requestHeaders: ApiParam[]
}
