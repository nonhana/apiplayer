export interface IApiResponse<T = any> {
  status: number
  message: string | string[]
  data?: T // 若请求失败无 data
  code?: number // 自定义错误码，请求失败时返回
  timestamp?: string // 时间戳，请求失败时返回
}
