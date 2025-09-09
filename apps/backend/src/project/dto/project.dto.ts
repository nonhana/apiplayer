import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { MemberDto } from '@/common/dto/member.dto'
import { RoleBriefDto } from '@/common/dto/role.dto'
import { ProjectEnvDto } from './env.dto'
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
  @Transform(({ value }) => (value !== null ? value : undefined))
  description?: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined))
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
  @Transform(({ obj }) => obj._count.members)
  memberCount: number

  @Expose()
  @Transform(({ obj }) => obj._count.apis)
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
  })
  currentUserRole?: RoleBriefDto
}

@Exclude()
export class ProjectDetailDto extends ProjectItemDto {
  @Expose()
  @Type(() => MemberDto)
  @Transform(({ obj }) => obj.members)
  recentMembers: MemberDto[]

  @Expose()
  @Transform(({ obj }) => obj._count.environments)
  environmentCount: number

  @Expose()
  @Type(() => ProjectEnvDto)
  @Transform(({ obj }) => obj.members)
  environments: ProjectEnvDto[]
}
