import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class UserBriefInfoDto {
  @Expose() id: string
  @Expose() email: string
  @Expose() username: string
  @Expose() name: string
  @Expose() avatar: string | null
}

@Exclude()
export class UserDetailInfoDto {
  @Expose() id: string
  @Expose() email: string
  @Expose() username: string
  @Expose() name: string
  @Expose() avatar: string | null

  @Expose() isActive: boolean
  @Expose() lastLoginAt: Date | null
  @Expose() createdAt: Date
}

@Exclude()
export class UserSessionDto {
  @Expose() sessionId: string
  @Expose() createdAt: Date
  @Expose() lastAccessed: Date
  @Expose() userAgent?: string
  @Expose() ipAddress?: string
  @Expose() isCurrent: boolean
}
