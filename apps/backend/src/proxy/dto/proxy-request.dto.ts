import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { HttpMethod } from '@/common/types/http'

export class ProxyRequestDto {
  /** 完整的目标 URL */
  @IsString({ message: '目标 URL 必须是字符串' })
  url: string

  /** HTTP 方法 */
  @IsEnum(HttpMethod, {
    message: 'HTTP 方法必须是 GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS 之一',
  })
  method: HttpMethod

  /** 请求头（可选） */
  @IsOptional()
  @IsObject({ message: '请求头必须是对象' })
  headers?: Record<string, string>

  /** 请求体（已序列化为字符串，可选） */
  @IsOptional()
  @IsString({ message: '请求体必须是字符串' })
  body?: string

  /** Content-Type 类型（可选） */
  @IsOptional()
  @IsString({ message: 'Content-Type 必须是字符串' })
  contentType?: string

  /** 请求超时时间，单位：毫秒（可选，默认 30000） */
  @IsOptional()
  @IsNumber({}, { message: '超时时间必须是数字' })
  @Min(1000, { message: '超时时间不能小于 1000 毫秒' })
  @Max(120000, { message: '超时时间不能超过 120000 毫秒' })
  timeout?: number
}
