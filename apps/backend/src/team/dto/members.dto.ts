import { Exclude, Expose, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'
import { TeamMemberDto } from './member.dto'

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
