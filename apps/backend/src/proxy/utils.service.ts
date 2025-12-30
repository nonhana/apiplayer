import { Injectable, Logger } from '@nestjs/common'
import { AxiosError } from 'axios'
import { HanaException } from '@/common/exceptions/hana.exception'
import { HttpMethod } from '@/common/types/http'
import { ProxyRequestDto } from './dto/proxy-request.dto'

@Injectable()
export class ProxyUtilsService {
  private readonly logger = new Logger(ProxyUtilsService.name)
  private readonly ALLOWED_PROTOCOLS = ['http:', 'https:']

  /** 创建 HTTPS Agent，用于处理 SSL 证书问题 */
  createHttpsAgent(): { rejectUnauthorized: boolean } | undefined {
    return { rejectUnauthorized: false }
  }

  /** 处理请求错误 */
  handleError(error: unknown, method: HttpMethod, url: string, timeoutMs: number): never {
    if (this.isAxiosError(error)) {
      const axiosError = error

      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        this.logger.warn(`代理请求超时: ${method} ${url} (${timeoutMs}ms)`)
        throw new HanaException(`请求超时，已超过 ${timeoutMs / 1000} 秒`, 40001)
      }

      const errorMessage = this.getNetworkErrorMessage(axiosError.code, axiosError.message)
      this.logger.error(`代理请求失败: ${method} ${url} - ${axiosError.code}: ${axiosError.message}`)
      throw new HanaException(errorMessage, 40002)
    }

    const message = error instanceof Error ? error.message : '未知错误'
    this.logger.error(`代理请求失败: ${method} ${url}`, error)
    throw new HanaException(`请求失败: ${message}`, 40003)
  }

  /** 判断是否为 Axios 错误 */
  isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError)?.isAxiosError === true
  }

  /** 根据错误码返回错误信息 */
  getNetworkErrorMessage(code: string | undefined, originalMessage: string): string {
    if (!code) {
      return `网络错误: ${originalMessage}`
    }

    const errorMessages: Record<string, string> = {
      ECONNREFUSED: '目标服务器拒绝连接，请检查服务是否启动',
      ENOTFOUND: '无法解析目标域名，请检查 URL 是否正确',
      ECONNRESET: '连接被目标服务器重置',
      ETIMEDOUT: '连接超时，目标服务器响应过慢',
      EHOSTUNREACH: '目标主机不可达',
      ENETUNREACH: '网络不可达',
      ECONNABORTED: '请求被中止',
      CERT_HAS_EXPIRED: '目标服务器 SSL 证书已过期',
      UNABLE_TO_VERIFY_LEAF_SIGNATURE: '无法验证目标服务器 SSL 证书',
      ERR_TLS_CERT_ALTNAME_INVALID: 'SSL 证书域名不匹配',
      ERR_BAD_REQUEST: '请求格式错误',
      ERR_BAD_RESPONSE: '响应格式错误',
    }

    return errorMessages[code] ?? `网络错误: ${originalMessage}`
  }

  /** 验证 URL 格式和协议 */
  validateUrl(urlString: string): string {
    try {
      const url = new URL(urlString)

      if (!this.ALLOWED_PROTOCOLS.includes(url.protocol)) {
        throw new HanaException('仅支持 HTTP/HTTPS 协议', 40004)
      }

      return urlString
    }
    catch (error) {
      if (error instanceof HanaException) {
        throw error
      }
      throw new HanaException('无效的 URL 格式', 40005)
    }
  }

  /** 构建请求头 */
  buildHeaders(dto: ProxyRequestDto): Record<string, string> {
    const headers: Record<string, string> = { ...dto.headers }

    if (dto.contentType) {
      headers['Content-Type'] = dto.contentType
    }

    const forbiddenHeaders = [
      'host',
      'connection',
      'content-length',
      'transfer-encoding',
    ]

    for (const header of forbiddenHeaders) {
      delete headers[header]
      delete headers[header.toLowerCase()]
      delete headers[header.charAt(0).toUpperCase() + header.slice(1)]
    }

    return headers
  }

  /** 解析响应头为普通对象 */
  parseHeaders(headers: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {}

    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        result[key] = Array.isArray(value) ? value.join(', ') : String(value)
      }
    }

    return result
  }

  /** 格式化文件大小 */
  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}
