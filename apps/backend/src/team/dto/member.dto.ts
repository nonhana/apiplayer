import { Exclude, Expose, Transform, Type } from 'class-transformer'

@Exclude()
export class TeamMemberUserDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  username: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  avatar?: string
}

@Exclude()
export class TeamMemberRoleDto {
  @Expose()
  id: string

  @Expose()
  name: string
}

@Exclude()
export class TeamMemberDto {
  @Expose()
  id: string

  @Expose()
  @Type(() => TeamMemberUserDto)
  @Transform(({ obj }) => obj.user)
  user: TeamMemberUserDto

  @Expose()
  @Type(() => TeamMemberRoleDto)
  @Transform(({ obj }) => obj.role)
  role: TeamMemberRoleDto

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  nickname?: string

  @Expose()
  joinedAt: Date
}
