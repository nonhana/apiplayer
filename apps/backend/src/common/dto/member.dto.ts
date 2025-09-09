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
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
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
  @Transform(({ obj }) => obj.user, { toClassOnly: true })
  user: MemberInfoDto

  @Expose()
  @Type(() => MemberRoleDto)
  @Transform(({ obj }) => obj.role, { toClassOnly: true })
  role: MemberRoleDto

  @Expose()
  joinedAt: Date
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
