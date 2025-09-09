import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { MemberDto } from '@/common/dto/member.dto'
import { PaginationDto } from '@/common/dto/pagination.dto'

@Exclude()
export class TeamMemberDto extends MemberDto {
  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  nickname?: string
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
