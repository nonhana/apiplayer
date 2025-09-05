import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { BasePaginatedQueryDto } from '@/common/dto/pagination.dto'

/** 项目列表查询 DTO */
export class QueryProjectsDto extends BasePaginatedQueryDto {
  /** 是否只显示公开项目 */
  @IsOptional()
  @IsBoolean({ message: '公开状态必须是布尔值' })
  isPublic?: boolean

  /** 团队 ID 过滤 */
  @IsOptional()
  @IsString({ message: '团队 ID 必须是字符串' })
  teamId?: string
}
