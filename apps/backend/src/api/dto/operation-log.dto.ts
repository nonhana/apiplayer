import { APIOperationType, VersionChangeType } from '@prisma/client'
import { Exclude, Expose, Type } from 'class-transformer'
import {
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import { BasePaginatedQueryDto, PaginationDto } from '@/common/dto/pagination.dto'
import { UserBriefInfoDto } from '@/common/dto/user.dto'

/** 获取 API 操作日志请求 DTO */
export class GetApiOperationLogsReqDto extends BasePaginatedQueryDto {
  /** 操作类型 */
  @IsOptional()
  @IsEnum(APIOperationType, { message: '操作类型必须是有效的枚举值' })
  operation?: APIOperationType

  /** 变更类型列表 */
  @IsOptional()
  @IsArray({ message: '变更类型必须是数组' })
  @IsEnum(VersionChangeType, {
    each: true,
    message: '变更类型必须是有效的枚举值',
  })
  changes?: VersionChangeType[]

  /** 目标用户 ID（过滤某个操作者） */
  @IsOptional()
  @IsString({ message: '用户ID必须是字符串' })
  targetUserId?: string

  /** 起始时间 */
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '开始时间必须是有效的日期' })
  startTime?: Date

  /** 结束时间 */
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '结束时间必须是有效的日期' })
  endTime?: Date
}

@Exclude()
export class ApiOperationLogItemDto {
  @Expose()
  id: string

  @Expose()
  apiId: string

  @Expose()
  versionId?: string

  @Expose()
  userId: string

  @Expose()
  operation: APIOperationType

  @Expose()
  changes: VersionChangeType[]

  @Expose()
  description?: string

  @Expose()
  metadata?: Record<string, any>

  @Expose()
  createdAt: Date

  /** 操作人基础信息 */
  @Expose()
  @Type(() => UserBriefInfoDto)
  user: UserBriefInfoDto
}

@Exclude()
export class ApiOperationLogsDto {
  @Expose()
  @Type(() => ApiOperationLogItemDto)
  logs: ApiOperationLogItemDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
