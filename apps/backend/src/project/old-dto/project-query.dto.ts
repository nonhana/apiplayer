import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

/** 项目列表查询 DTO */
export class ProjectListQueryDto {
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

  /** 是否只显示公开项目 */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true')
      return true
    if (value === 'false')
      return false
    return value
  })
  @IsBoolean({ message: '公开状态必须是布尔值' })
  isPublic?: boolean

  /** 团队 ID 过滤 */
  @IsOptional()
  @IsString({ message: '团队 ID 必须是字符串' })
  teamId?: string
}

/** 分页信息 DTO */
export class PaginationDto {
  page: number
  limit: number
  totalPages: number
  hasNext?: boolean
  hasPrev?: boolean
}

/** 项目列表响应 DTO */
export class ProjectListResponseDto {
  projects: Array<{
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
    isPublic: boolean
    createdAt: Date
    updatedAt: Date
    memberCount: number
    apiCount: number
    team: {
      id: string
      name: string
      slug: string
    }
    currentUserRole?: {
      id: string
      name: string
      description?: string
    }
  }>

  total: number
  pagination: PaginationDto
}

/** 用户最近访问项目响应 DTO */
export class RecentlyProjectsResponseDto {
  projects: Array<{
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
    isPublic: boolean
    team: {
      id: string
      name: string
      slug: string
    }
    lastVisitedAt: Date
  }>

  total: number
}
