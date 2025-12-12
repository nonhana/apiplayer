export interface IApiResponse<T = any> {
  code: number
  message: string | string[]
  data?: T // 若请求失败无 data
  errorCode?: number // 请求失败返回
  timestamp?: string // 请求失败返回
}
