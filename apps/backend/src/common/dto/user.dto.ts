import { Exclude, Expose, Transform } from 'class-transformer'

@Exclude()
export class UserBriefInfoDto {
  @Expose()
  id: string

  @Expose()
  email: string

  @Expose()
  username: string

  @Expose()
  name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  avatar?: string
}

@Exclude()
export class UserDetailInfoDto extends UserBriefInfoDto {
  @Expose()
  isActive: boolean

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  lastLoginAt?: Date

  @Expose()
  createdAt: Date
}

@Exclude()
export class UserFullInfoDto extends UserDetailInfoDto {
  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  bio?: string

  @Expose()
  updatedAt: Date
}

@Exclude()
export class UserSessionDto {
  @Expose()
  sessionId: string

  @Expose()
  createdAt: Date

  @Expose()
  lastAccessed: Date

  @Expose()
  userAgent?: string

  @Expose()
  ipAddress?: string

  @Expose()
  isCurrent: boolean
}
