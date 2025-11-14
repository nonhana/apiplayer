import { APIMethod, APIStatus } from '@prisma/client'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class CreateApiReqDto {
  @IsNotEmpty({ message: 'API分组ID不能为空' })
  @IsString({ message: 'API分组ID必须是字符串' })
  groupId: string

  @IsNotEmpty({ message: 'API名称不能为空' })
  @IsString({ message: 'API名称必须是字符串' })
  @MinLength(1, { message: 'API名称不能为空' })
  @MaxLength(128, { message: 'API名称长度不能超过 128 个字符' })
  name: string

  @IsNotEmpty({ message: 'API路径不能为空' })
  @IsString({ message: 'API路径必须是字符串' })
  @MinLength(1, { message: 'API路径不能为空' })
  path: string

  @IsNotEmpty({ message: 'API方法不能为空' })
  @IsEnum(APIMethod, { message: 'API方法必须是有效的枚举值' })
  method: APIMethod

  @IsOptional()
  @IsString({ message: '版本描述必须是字符串' })
  @MaxLength(1024, { message: '版本描述长度不能超过 1024 个字符' })
  description?: string

  @IsOptional()
  @IsArray({ message: 'API标签必须是数组' })
  @IsString({ each: true, message: 'API标签必须是字符串' })
  @MinLength(1, { each: true, message: 'API标签不能为空' })
  @MaxLength(16, { each: true, message: 'API标签长度不能超过 16 个字符' })
  tags?: string[]

  @IsOptional()
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号必须大于等于 0' })
  sortOrder?: number

  // 首个版本
  @IsOptional()
  @IsString({ message: '版本号必须是字符串' })
  @Matches(/^v\d+\.\d+\.\d+$/, { message: '版本号格式必须为 vX.X.X，如 v1.0.0' })
  version?: string

  @IsOptional()
  @IsString({ message: '版本摘要必须是字符串' })
  @MaxLength(1024, { message: '版本摘要长度不能超过 1024 个字符' })
  summary?: string

  @IsOptional()
  @IsEnum(APIStatus, { message: 'API状态必须是有效的枚举值' })
  status?: APIStatus

  @IsOptional()
  @IsArray({ message: '请求头必须是数组' })
  @IsObject({ each: true, message: '每个请求头 Item，必须是对象' })
  requestHeaders?: Record<string, any>[]

  @IsOptional()
  @IsArray({ message: '路径参数必须是数组' })
  @IsObject({ each: true, message: '每个路径参数 Item，必须是对象' })
  pathParams?: Record<string, any>[]

  @IsOptional()
  @IsArray({ message: '查询参数必须是数组' })
  @IsObject({ each: true, message: '每个查询参数 Item，必须是对象' })
  queryParams?: Record<string, any>[]

  @IsOptional()
  @IsObject({ message: '请求体必须是对象' })
  requestBody?: Record<string, any>

  @IsOptional()
  @IsArray({ message: '响应列表必须是数组' })
  @IsObject({ each: true, message: '每个响应 Item，必须是对象' })
  responses?: { name: string, httpStatus: number, body: Record<string, any> }[]

  @IsOptional()
  @IsObject({ message: '示例数据必须是对象' })
  examples?: Record<string, any>

  @IsOptional()
  @IsObject({ message: 'Mock 配置必须是对象' })
  mockConfig?: Record<string, any>

  @IsOptional()
  @IsString({ message: '负责人ID必须是字符串' })
  ownerId?: string
}
