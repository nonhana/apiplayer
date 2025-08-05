import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

/** 团队列表查询参数 DTO */
export class TeamListQueryDto {
  /** 页码 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为 1' })
  page?: number = 1

  /** 每页数量 */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为 1' })
  @Max(100, { message: '每页数量最大为 100' })
  limit?: number = 10

  /** 搜索关键词 */
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string
}

/** 团队信息 DTO */
export interface TeamInfoDto {
  /** 团队 ID */
  id: string

  /** 团队名称 */
  name: string

  /** 团队标识符 */
  slug: string

  /** 团队描述 */
  description?: string

  /** 团队头像 */
  avatar?: string

  /** 是否激活 */
  isActive: boolean

  /** 创建时间 */
  createdAt: Date

  /** 更新时间 */
  updatedAt: Date

  /** 成员数量 */
  memberCount: number

  /** 项目数量 */
  projectCount: number

  /** 当前用户在团队中的角色 */
  currentUserRole?: {
    id: string
    name: string
    description?: string
  }

  /** 当前用户在团队中的权限 */
  currentUserPermissions?: string[]
}

/** 团队详情 DTO */
export interface TeamDetailDto extends TeamInfoDto {
  /** 最近的成员（限制数量） */
  recentMembers: {
    id: string
    user: {
      id: string
      username: string
      name: string
      avatar?: string
    }
    role: {
      id: string
      name: string
    }
    nickname?: string
    joinedAt: Date
  }[]

  /** 最近的项目（限制数量） */
  recentProjects: {
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
    createdAt: Date
  }[]
}

/** 团队列表响应 DTO */
export class TeamListResponseDto {
  /** 团队列表 */
  teams: TeamInfoDto[]

  /** 总数 */
  total: number

  /** 分页信息 */
  pagination: {
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/** 团队详情响应 DTO */
export class TeamDetailResponseDto {
  /** 团队详情 */
  team: TeamDetailDto
}

/** 删除团队响应 DTO */
export class DeleteTeamResponseDto {
  /** 响应消息 */
  message: string

  /** 被删除的团队 ID */
  deletedTeamId: string
}
