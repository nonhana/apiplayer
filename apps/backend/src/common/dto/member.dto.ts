import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'

@Exclude()
export class MemberInfoDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  email: string

  @Expose()
  username: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  avatar?: string
}

@Exclude()
export class MemberRoleDto {
  @Expose()
  id: string

  @Expose()
  name: string
}

@Exclude()
export class MemberDto {
  @Expose()
  id: string

  @Expose()
  @Type(() => MemberInfoDto)
  @Transform(({ obj }) => obj.user)
  user: MemberInfoDto

  @Expose()
  @Type(() => MemberRoleDto)
  @Transform(({ obj }) => obj.role)
  role: MemberRoleDto

  @Expose()
  joinedAt: Date
}

@Exclude()
export class TeamMemberDto extends MemberDto {
  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  nickname?: string
}

@Exclude()
export class MembersDto {
  @Expose()
  @Type(() => MemberDto)
  members: MemberDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}

@Exclude()
export class TeamMembersDto {
  @Expose()
  @Type(() => TeamMemberDto)
  members: TeamMemberDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
