import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

/** 邀请团队成员请求 DTO */
export class InviteTeamMemberDto {
  /** 被邀请用户的邮箱 */
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  /** 角色 ID */
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string

  /** 昵称（可选） */
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过 50 个字符' })
  nickname?: string
}

/** 更新团队成员角色请求 DTO */
export class UpdateTeamMemberRoleDto {
  /** 新角色 ID */
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string

  /** 昵称（可选） */
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过 50 个字符' })
  nickname?: string
}

/** 团队成员信息 DTO */
export interface TeamMemberInfoDto {
  /** 成员 ID */
  id: string

  /** 用户信息 */
  user: {
    id: string
    username: string
    name: string
    email: string
    avatar?: string
  }

  /** 角色信息 */
  role: {
    id: string
    name: string
    description?: string
  }

  /** 在团队中的昵称 */
  nickname?: string

  /** 加入时间 */
  joinedAt: Date
}

/** 邀请团队成员响应 DTO */
export class InviteTeamMemberResponseDto {
  /** 响应消息 */
  message: string

  /** 成员信息 */
  member: TeamMemberInfoDto
}

/** 团队成员列表响应 DTO */
export class TeamMembersResponseDto {
  /** 成员列表 */
  members: TeamMemberInfoDto[]

  /** 总数 */
  total: number

  /** 分页信息 */
  pagination?: {
    page: number
    limit: number
    totalPages: number
  }
}

/** 更新团队成员响应 DTO */
export class UpdateTeamMemberResponseDto {
  /** 响应消息 */
  message: string

  /** 更新后的成员信息 */
  member: TeamMemberInfoDto
}

/** 移除团队成员响应 DTO */
export class RemoveTeamMemberResponseDto {
  /** 响应消息 */
  message: string

  /** 被移除的成员 ID */
  removedMemberId: string
}
