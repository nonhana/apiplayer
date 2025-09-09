import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { MemberDto } from '@/common/dto/member.dto'
import { PaginationDto } from '@/common/dto/pagination.dto'
import { RoleBriefDto } from '@/common/dto/role.dto'
import { ProjectEnvDto } from './env/env.dto'
import { ProjectTeamDto } from './project-team.dto'

@Exclude()
export class ProjectBriefDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  slug: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  description?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  icon?: string

  @Expose()
  isPublic: boolean

  @Expose()
  createdAt: Date
}

@Exclude()
export class ProjectItemDto extends ProjectBriefDto {
  @Expose()
  updatedAt: Date

  @Expose()
  @Transform(({ obj }) => obj._count.members, { toClassOnly: true })
  memberCount: number

  @Expose()
  @Transform(({ obj }) => obj._count.apis, { toClassOnly: true })
  apiCount: number

  @Expose()
  @Type(() => ProjectTeamDto)
  team: ProjectTeamDto

  @Expose()
  @Type(() => RoleBriefDto)
  @Transform(({ obj }) => {
    const curUser = obj.members[0]
    if (!curUser || !curUser.role)
      return undefined

    return {
      id: curUser.role.id,
      name: curUser.role.name,
      description: curUser.role.description,
    }
  }, { toClassOnly: true })
  currentUserRole?: RoleBriefDto
}

@Exclude()
export class ProjectDetailDto extends ProjectItemDto {
  @Expose()
  @Type(() => MemberDto)
  @Transform(({ obj }) => obj.members, { toClassOnly: true })
  recentMembers: MemberDto[]

  @Expose()
  @Transform(({ obj }) => obj._count.environments, { toClassOnly: true })
  environmentCount: number

  @Expose()
  @Type(() => ProjectEnvDto)
  @Transform(({ obj }) => obj.members, { toClassOnly: true })
  environments: ProjectEnvDto[]
}

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
