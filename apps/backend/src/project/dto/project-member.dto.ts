import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

/** 邀请项目成员请求 DTO */
export class InviteProjectMemberDto {
  /** 用户邮箱 */
  @IsNotEmpty({ message: '用户邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string

  /** 角色 ID */
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string
}

/** 更新项目成员角色请求 DTO */
export class UpdateProjectMemberRoleDto {
  /** 角色 ID */
  @IsNotEmpty({ message: '角色 ID 不能为空' })
  @IsString({ message: '角色 ID 必须是字符串' })
  roleId: string
}

/** 项目成员信息 DTO */
export class ProjectMemberInfoDto {
  id: string
  user: {
    id: string
    username: string
    name: string
    email: string
    avatar?: string
  }

  role: {
    id: string
    name: string
    description?: string
  }

  joinedAt: Date
}

/** 邀请项目成员响应 DTO */
export class InviteProjectMemberResponseDto {
  message: string
  member: ProjectMemberInfoDto
}

/** 更新项目成员响应 DTO */
export class UpdateProjectMemberResponseDto {
  message: string
  member: ProjectMemberInfoDto
}

/** 移除项目成员响应 DTO */
export class RemoveProjectMemberResponseDto {
  message: string
  removedMemberId: string
}

/** 项目成员列表响应 DTO */
export class ProjectMembersResponseDto {
  members: ProjectMemberInfoDto[]
  total: number
  pagination: {
    page: number
    limit: number
    totalPages: number
  }
}
