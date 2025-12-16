import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { APIMethod, APIStatus, VersionChangeType, VersionStatus } from 'prisma/generated/client'

/** 更新 API 基本信息 DTO */
export class UpdateApiBaseInfoDto {
  /** API 分组 ID */
  @IsOptional()
  @IsString({ message: 'API 分组 ID 必须是字符串' })
  groupId?: string

  /** API 名称 */
  @IsOptional()
  @IsString({ message: 'API 名称必须是字符串' })
  @MinLength(1, { message: 'API 名称不能为空' })
  @MaxLength(128, { message: 'API 名称长度不能超过 128 个字符' })
  name?: string

  /** API 描述 */
  @IsOptional()
  @IsString({ message: 'API 描述必须是字符串' })
  @MaxLength(1024, { message: 'API 描述长度不能超过 1024 个字符' })
  description?: string

  /** 请求方法 */
  @IsOptional()
  @IsEnum(APIMethod, { message: '请求方法必须是有效的枚举值' })
  method?: APIMethod

  /** API 状态 */
  @IsOptional()
  @IsEnum(APIStatus, { message: 'API 状态必须是有效的枚举值' })
  status?: APIStatus

  /** API 路径 */
  @IsOptional()
  @IsString({ message: 'API 路径必须是字符串' })
  @MinLength(1, { message: 'API 路径不能为空' })
  path?: string

  /** 标签 */
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '标签必须是字符串' })
  @MinLength(1, { each: true, message: '标签不能为空' })
  @MaxLength(16, { each: true, message: '标签长度不能超过 16 个字符' })
  tags?: string[]

  /** 在同层级中的排序 */
  @IsOptional()
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号必须大于等于 0' })
  sortOrder?: number

  /** 负责人ID */
  @IsOptional()
  @IsString({ message: '负责人ID必须是字符串' })
  ownerId?: string
}

/** 更新 API 核心信息 DTO */
export class UpdateApiCoreInfoDto {
  /** 请求头 */
  @IsOptional()
  @IsArray({ message: '请求头必须是数组' })
  @IsObject({ each: true, message: '每个请求头 Item，必须是对象' })
  @Type(() => Object)
  requestHeaders?: Record<string, any>[]

  /** 路径参数 */
  @IsOptional()
  @IsArray({ message: '路径参数必须是数组' })
  @IsObject({ each: true, message: '每个路径参数 Item，必须是对象' })
  @Type(() => Object)
  pathParams?: Record<string, any>[]

  /** 查询参数 */
  @IsOptional()
  @IsArray({ message: '查询参数必须是数组' })
  @IsObject({ each: true, message: '每个查询参数 Item，必须是对象' })
  @Type(() => Object)
  queryParams?: Record<string, any>[]

  /** 请求体 */
  @IsOptional()
  @IsObject({ message: '请求体必须是对象' })
  requestBody?: Record<string, any>

  /** 响应列表 */
  @IsOptional()
  @IsArray({ message: '响应列表必须是数组' })
  @IsObject({ each: true, message: '每个响应 Item，必须是对象' })
  @Type(() => Object)
  responses?: Record<string, any>[]

  /** 示例数据 */
  @IsOptional()
  @IsObject({ message: '示例数据必须是对象' })
  examples?: Record<string, any>

  /** Mock 配置 */
  @IsOptional()
  @IsObject({ message: 'Mock 配置必须是对象' })
  mockConfig?: Record<string, any>
}

/** 更新 API 版本信息 DTO */
export class UpdateApiVersionInfoDto {
  /** 版本状态 */
  @IsOptional()
  @IsEnum(VersionStatus, { message: '版本状态必须是有效的枚举值' })
  status?: VersionStatus

  /** 版本号 */
  @IsOptional()
  @IsString({ message: '版本号必须是字符串' })
  @Matches(/^v\d+\.\d+\.\d+$/, { message: '版本号格式必须为 vX.X.X，如 v1.0.0' })
  version?: string

  /** 版本摘要 */
  @IsOptional()
  @IsString({ message: '版本摘要必须是字符串' })
  @MaxLength(1024, { message: '版本摘要长度不能超过 1024 个字符' })
  summary?: string

  /** 变更日志 */
  @IsOptional()
  @IsString({ message: '变更日志必须是字符串' })
  @MaxLength(1024, { message: '变更日志长度不能超过 1024 个字符' })
  changelog?: string

  /** 变更类型 */
  @IsOptional()
  @IsArray({ message: '变更类型必须是数组' })
  @IsEnum(VersionChangeType, { each: true, message: '变更类型必须是有效的枚举值' })
  changes?: VersionChangeType[]
}

/** 更新 API 信息请求体 DTO */
export class UpdateApiReqDto {
  /** 基本信息 */
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApiBaseInfoDto)
  baseInfo?: UpdateApiBaseInfoDto

  /** 核心信息 */
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApiCoreInfoDto)
  coreInfo?: UpdateApiCoreInfoDto

  /** 版本信息 */
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateApiVersionInfoDto)
  versionInfo?: UpdateApiVersionInfoDto
}
