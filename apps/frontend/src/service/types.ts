export interface IApiResponse<T = any> {
  code: number
  message: string | string[]
  data: T
}
