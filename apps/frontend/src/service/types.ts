export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T
}
