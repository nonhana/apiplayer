import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

/** 参数数据类型枚举 */
export enum ParamType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  FILE = 'FILE',
}

/** 请求参数类型枚举 */
export enum RequestParamCategory {
  PATH = 'PATH',
  QUERY = 'QUERY',
  HEADER = 'HEADER',
  COOKIE = 'COOKIE',
  FORM_DATA = 'FORM_DATA',
  FORM_URL_ENCODED = 'FORM_URL_ENCODED',
  BODY_JSON = 'BODY_JSON',
  BODY_XML = 'BODY_XML',
  BODY_RAW = 'BODY_RAW',
}

/** 创建全局参数请求 DTO */
export class CreateGlobalParamDto {
  /** 参数类别 */
  @IsNotEmpty({ message: '参数类别不能为空' })
  @IsEnum(RequestParamCategory, { message: '参数类别必须是有效的枚举值' })
  category: RequestParamCategory

  /** 参数名称 */
  @IsNotEmpty({ message: '参数名称不能为空' })
  @IsString({ message: '参数名称必须是字符串' })
  @MinLength(1, { message: '参数名称长度不能少于 1 个字符' })
  @MaxLength(100, { message: '参数名称长度不能超过 100 个字符' })
  name: string

  /** 参数类型 */
  @IsNotEmpty({ message: '参数类型不能为空' })
  @IsEnum(ParamType, { message: '参数类型必须是有效的枚举值' })
  type: ParamType

  /** 参数值 */
  @IsNotEmpty({ message: '参数值不能为空' })
  value: any

  /** 参数描述 */
  @IsOptional()
  @IsString({ message: '参数描述必须是字符串' })
  @MaxLength(500, { message: '参数描述长度不能超过 500 个字符' })
  description?: string

  /** 是否启用 */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean
}

/** 更新全局参数请求 DTO */
export class UpdateGlobalParamDto {
  /** 参数类型 */
  @IsOptional()
  @IsEnum(ParamType, { message: '参数类型必须是有效的枚举值' })
  type?: ParamType

  /** 参数值 */
  @IsOptional()
  value?: any

  /** 参数描述 */
  @IsOptional()
  @IsString({ message: '参数描述必须是字符串' })
  @MaxLength(500, { message: '参数描述长度不能超过 500 个字符' })
  description?: string

  /** 是否启用 */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean
}

/** 全局参数查询 DTO */
export class GlobalParamQueryDto {
  /** 页码 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码不能小于 1' })
  page?: number = 1

  /** 每页数量 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量不能小于 1' })
  @Max(100, { message: '每页数量不能超过 100' })
  limit?: number = 10

  /** 搜索关键词 */
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string

  /** 参数类别过滤 */
  @IsOptional()
  @IsEnum(RequestParamCategory, { message: '参数类别必须是有效的枚举值' })
  category?: RequestParamCategory

  /** 参数类型过滤 */
  @IsOptional()
  @IsEnum(ParamType, { message: '参数类型必须是有效的枚举值' })
  type?: ParamType

  /** 是否只显示启用的参数 */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true')
      return true
    if (value === 'false')
      return false
    return value
  })
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean
}

/** 全局参数信息 DTO */
export class GlobalParamInfoDto {
  id: string
  category: RequestParamCategory
  name: string
  type: ParamType
  value: any
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/** 创建全局参数响应 DTO */
export class CreateGlobalParamResponseDto {
  message: string
  param: GlobalParamInfoDto
}

/** 更新全局参数响应 DTO */
export class UpdateGlobalParamResponseDto {
  message: string
  param: GlobalParamInfoDto
}

/** 删除全局参数响应 DTO */
export class DeleteGlobalParamResponseDto {
  message: string
  deletedParamId: string
}

/** 全局参数列表响应 DTO */
export class GlobalParamsResponseDto {
  params: GlobalParamInfoDto[]
  total: number
  pagination: {
    page: number
    limit: number
    totalPages: number
    hasNext?: boolean
    hasPrev?: boolean
  }
}

/** 批量创建全局参数请求 DTO */
export class BatchCreateGlobalParamsDto {
  /** 参数列表 */
  @IsNotEmpty({ message: '参数列表不能为空' })
  params: CreateGlobalParamDto[]
}

/** 批量创建全局参数响应 DTO */
export class BatchCreateGlobalParamsResponseDto {
  message: string
  createdCount: number
  params: GlobalParamInfoDto[]
}
