/** 基础分页查询参数 */
export interface BasePaginatedQuery {
  page?: number
  limit?: number
  search?: string
}

export * from './api'
