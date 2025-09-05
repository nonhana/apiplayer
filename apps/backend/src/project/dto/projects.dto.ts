import { Exclude, Expose, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'
import { ProjectItemDto } from './project.dto'

@Exclude()
export class ProjectsDto {
  @Expose()
  @Type(() => ProjectItemDto)
  projects: ProjectItemDto[]

  @Expose()
  total: number

  @Expose()
  @Type(() => PaginationDto)
  pagination: PaginationDto
}
