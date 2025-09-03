import { Exclude, Expose, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'
import { TeamItemDto } from './team.dto'

@Exclude()
export class TeamsDto {
  @Expose()
  @Type(() => TeamItemDto)
  teams: TeamItemDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
