import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { InvitationStatus } from 'prisma/generated/enums'
import { UserBriefInfoDto } from '@/common/dto/user.dto'
import { RoleDto } from '@/role/dto/role.dto'

/**
 * 团队邀请响应 DTO
 */
@Exclude()
export class InvitationDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  nickname?: string

  @Expose()
  status: InvitationStatus

  @Expose()
  @Type(() => UserBriefInfoDto)
  inviter: UserBriefInfoDto

  @Expose()
  @Type(() => RoleDto)
  role: RoleDto

  @Expose()
  expiresAt: Date

  @Expose()
  createdAt: Date

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  acceptedAt?: Date
}

/**
 * 验证邀请响应 DTO（公开接口使用）
 */
@Exclude()
export class VerifyInvitationDto {
  @Expose()
  valid: boolean

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  invitation?: {
    id: string
    email: string
    teamName: string
    teamAvatar?: string
    teamSlug: string
    roleName: string
    roleDescription?: string
    inviterName: string
    expiresAt: Date
  }

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  error?: 'INVALID_TOKEN' | 'EXPIRED' | 'ALREADY_ACCEPTED' | 'CANCELLED'

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  emailRegistered?: boolean
}

/**
 * 接受邀请请求 DTO
 */
export class AcceptInvitationDto {
  @Expose()
  token: string
}

/**
 * 接受邀请响应 DTO
 */
@Exclude()
export class AcceptInvitationResultDto {
  @Expose()
  success: boolean

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  teamId?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  teamSlug?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  error?: 'EMAIL_MISMATCH' | 'INVALID_TOKEN' | 'EXPIRED' | 'ALREADY_MEMBER' | 'CANCELLED'
}
