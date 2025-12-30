/**
 * 代理响应 DTO
 * @description 用于返回目标服务器的响应信息
 */
export class ProxyResponseDto {
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
