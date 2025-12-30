import { Buffer } from 'node:buffer'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import { firstValueFrom } from 'rxjs'
import { ProxyRequestDto } from './dto/proxy-request.dto'
import { ProxyResponseDto } from './dto/proxy-response.dto'
import { ProxyUtilsService } from './utils.service'

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name)
  private readonly DEFAULT_TIMEOUT = 30000
  private readonly MAX_RESPONSE_SIZE = 10 * 1024 * 1024

  constructor(
    private readonly httpService: HttpService,
    private readonly proxyUtilsService: ProxyUtilsService,
  ) {}

  /** 转发请求到目标服务器 */
  async forward(dto: ProxyRequestDto): Promise<ProxyResponseDto> {
    const targetUrl = this.proxyUtilsService.validateUrl(dto.url)
    const timeoutMs = dto.timeout ?? this.DEFAULT_TIMEOUT

    this.logger.log(`代理请求: ${dto.method} ${targetUrl}`)

    const startTime = Date.now()

    try {
      const config: AxiosRequestConfig = {
        url: targetUrl,
        method: dto.method.toLowerCase() as Method,
        headers: this.proxyUtilsService.buildHeaders(dto),
        timeout: timeoutMs,
        maxContentLength: this.MAX_RESPONSE_SIZE,
        maxBodyLength: this.MAX_RESPONSE_SIZE,
        responseType: 'text',
        transformResponse: data => data,
        httpsAgent: this.proxyUtilsService.createHttpsAgent(),
        validateStatus: () => true,
      }

      if (dto.body && !['GET', 'HEAD'].includes(dto.method)) {
        config.data = dto.body
      }

      const response: AxiosResponse<string> = await firstValueFrom(
        this.httpService.request<string>(config),
      )

      const duration = Date.now() - startTime

      const headers = this.proxyUtilsService.parseHeaders(response.headers)

      const body = response.data ?? ''

      const size = Buffer.byteLength(body, 'utf-8')

      this.logger.log(`代理响应: ${response.status} ${response.statusText} (${duration}ms, ${this.proxyUtilsService.formatSize(size)})`)

      return {
        status: response.status,
        statusText: response.statusText ?? '',
        headers,
        body,
        duration,
        size,
      }
    }
    catch (error) {
      return this.proxyUtilsService.handleError(error, dto.method, targetUrl, timeoutMs)
    }
  }
}
