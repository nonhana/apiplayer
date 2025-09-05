import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { ProjectTeamDto } from './project-team.dto'

@Exclude()
export class RecentProjectItemDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  slug: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  description?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
  icon?: string

  @Expose()
  isPublic: boolean

  @Expose()
  @Type(() => ProjectTeamDto)
  team: ProjectTeamDto

  @Expose()
  lastVisitedAt: Date
}

@Exclude()
export class RecentlyProjectsResDto {
  @Expose()
  @Type(() => RecentProjectItemDto)
  projects: RecentProjectItemDto[]

  @Expose()
  total: number
}
