export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export class HanaError extends Error {
  public code: number

  constructor(message: string, code: number) {
    super(message)
    this.name = 'HanaError'
    this.code = code
  }
}
