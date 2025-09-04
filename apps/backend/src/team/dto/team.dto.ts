import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { TeamMemberDto } from './member.dto'
import { TeamProjectDto } from './team-project.dto'
import { TeamUserRoleDto } from './team-user-role.dto'

@Exclude()
export class TeamDto {
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
  avatar?: string

  @Expose()
  createdAt: Date
}

@Exclude()
export class TeamItemDto extends TeamDto {
  @Expose()
  isActive: boolean

  @Expose()
  updatedAt: Date

  @Expose()
  @Transform(({ obj }) => obj._count.members)
  memberCount: number

  @Expose()
  @Transform(({ obj }) => obj._count.projects)
  projectCount: number

  @Expose()
  @Type(() => TeamUserRoleDto)
  @Transform(({ obj }) => {
    const curUser = obj.members[0]
    if (!curUser || !curUser.role)
      return undefined

    return {
      id: curUser.role.id,
      name: curUser.role.id,
      description: curUser.role.description,
    }
  })
  currentUserRole?: TeamUserRoleDto
}

@Exclude()
export class TeamDetailDto extends TeamItemDto {
  @Expose()
  @Type(() => TeamMemberDto)
  @Transform(({ obj }) => obj.members)
  recentMembers: TeamMemberDto[]

  @Expose()
  @Type(() => TeamProjectDto)
  @Transform(({ obj }) => obj.projects)
  recentProjects: TeamProjectDto[]
}
