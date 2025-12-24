import { Exclude, Expose, Type } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'
import { BasePaginatedQueryDto, PaginationDto } from '@/common/dto/pagination.dto'
import { UserBriefInfoDto } from '@/common/dto/user.dto'

/** 搜索用户请求 DTO */
export class SearchUsersReqDto extends BasePaginatedQueryDto {
  /** 团队 ID */
  @IsOptional()
  @IsString({ message: '团队 ID 必须是字符串' })
  teamId?: string

  /** 项目 ID */
  @IsOptional()
  @IsString({ message: '项目 ID 必须是字符串' })
  projectId?: string
}

/** 用户搜索结果 DTO */
@Exclude()
export class SearchUsersResDto {
  @Expose()
  @Type(() => UserBriefInfoDto)
  users: UserBriefInfoDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
