import type { APIMethod, APIStatus } from '@prisma/client'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateApiReqDto {
  @IsNotEmpty({ message: '分组ID不能为空' })
  @IsString({ message: '分组ID必须是字符串' })
  groupId: string

  @IsNotEmpty({ message: '名称不能为空' })
  @IsString({ message: '名称必须是字符串' })
  @MinLength(1)
  @MaxLength(100)
  name: string

  @IsNotEmpty({ message: '路径不能为空' })
  @IsString({ message: '路径必须是字符串' })
  path: string

  @IsNotEmpty({ message: '方法不能为空' })
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'] as any, {
    message: '方法不合法',
  })
  method: APIMethod

  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  tags?: string[]

  @IsOptional()
  sortOrder?: number

  // 首个版本
  @IsOptional()
  @IsString()
  version?: string

  @IsOptional()
  @IsString()
  summary?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(['DRAFT', 'TESTING', 'PUBLISHED', 'DEPRECATED'])
  status?: APIStatus

  @IsOptional()
  requestHeaders?: Record<string, any>[]

  @IsOptional()
  pathParams?: Record<string, any>[]

  @IsOptional()
  queryParams?: Record<string, any>[]

  @IsOptional()
  requestBody?: Record<string, any>

  @IsOptional()
  responses?: { name: string, httpStatus: number, body: Record<string, any> }[]

  @IsOptional()
  examples?: Record<string, any>

  @IsOptional()
  mockConfig?: Record<string, any>

  @IsOptional()
  @IsString()
  ownerId?: string | null
}
