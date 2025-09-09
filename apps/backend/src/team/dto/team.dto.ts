import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { PaginationDto } from '@/common/dto/pagination.dto'
import { RoleBriefDto } from '@/common/dto/role.dto'
import { TeamMemberDto } from './member/member.dto'
import { TeamProjectDto } from './team-project.dto'

@Exclude()
export class TeamDto {
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
  @Transform(({ obj }) => obj?._count?.members ?? 0, { toClassOnly: true })
  memberCount: number

  @Expose()
  @Transform(({ obj }) => obj?._count?.projects ?? 0, { toClassOnly: true })
  projectCount: number

  @Expose()
  @Type(() => RoleBriefDto)
  @Transform(({ obj }) => {
    const curUser = obj?.members?.[0]
    if (!curUser || !curUser.role)
      return undefined

    return {
      id: curUser.role.id,
      name: curUser.role.id,
      description: curUser.role.description,
    }
  }, { toClassOnly: true })
  currentUserRole?: RoleBriefDto
}

@Exclude()
export class TeamDetailDto extends TeamItemDto {
  @Expose()
  @Type(() => TeamMemberDto)
  @Transform(({ obj }) => obj?.members ?? [], { toClassOnly: true })
  recentMembers: TeamMemberDto[]

  @Expose()
  @Type(() => TeamProjectDto)
  @Transform(({ obj }) => obj?.projects ?? [], { toClassOnly: true })
  recentProjects: TeamProjectDto[]
}

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
