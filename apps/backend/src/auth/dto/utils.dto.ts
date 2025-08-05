import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator'

/**
 * 检查用户名/邮箱可用性请求 DTO
 */
export class CheckAvailabilityDto {
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string

  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 20, { message: '用户名长度必须在3-20位之间' })
  @Matches(/^[\w-]+$/, {
    message: '用户名只能包含字母、数字、下划线和连字符',
  })
  username?: string
}

/**
 * 检查可用性响应 DTO
 */
export class CheckAvailabilityResponseDto {
  available: boolean
  message: string
}

/**
 * 登出响应 DTO
 */
export class LogoutResponseDto {
  message: string
}

/**
 * 当前用户信息响应 DTO
 */
export class CurrentUserResponseDto {
  id: string
  email: string
  username: string
  name: string
  avatar: string | null
  roles: string[]
  permissions?: string[] // 用户的所有权限
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

/**
 * 用户会话信息 DTO
 */
export class UserSessionDto {
  sessionId: string
  createdAt: Date
  lastAccessed: Date
  userAgent?: string
  ipAddress?: string
  isCurrent: boolean
}

/**
 * 活跃会话列表响应 DTO
 */
export class ActiveSessionsResponseDto {
  sessions: UserSessionDto[]
  total: number
}
