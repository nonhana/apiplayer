import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { InvitationStatus } from 'prisma/generated/enums'
import { RoleBriefDto } from '@/common/dto/role.dto'
import { UserBriefInfoDto } from '@/common/dto/user.dto'

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
  @Type(() => RoleBriefDto)
  role: RoleBriefDto

  @Expose()
  expiresAt: Date

  @Expose()
  createdAt: Date

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  acceptedAt?: Date
}

/**
 * 邀请简要信息 DTO
 */
@Exclude()
export class InvitationBriefDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  @Transform(({ obj }) => obj.team.name, { toClassOnly: true })
  teamName: string

  @Expose()
  @Transform(({ obj }) => obj.team?.avatar, { toClassOnly: true })
  teamAvatar?: string

  @Expose()
  @Transform(({ obj }) => obj.team.slug, { toClassOnly: true })
  teamSlug: string

  @Expose()
  @Transform(({ obj }) => obj.role.name, { toClassOnly: true })
  roleName: string

  @Expose()
  @Transform(({ obj }) => obj.role?.description, { toClassOnly: true })
  roleDescription?: string

  @Expose()
  @Transform(({ obj }) => obj.inviter.name, { toClassOnly: true })
  inviterName: string

  @Expose()
  expiresAt: Date
}

/**
 * 验证邀请响应 DTO
 */
@Exclude()
export class VerifyInvitationDto {
  @Expose()
  valid: boolean

  @Expose()
  emailRegistered: boolean

  @Expose()
  @Type(() => InvitationBriefDto)
  invitation: InvitationBriefDto
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
  @Transform(({ obj }) => obj.team?.slug, { toClassOnly: true })
  teamSlug?: string
}
