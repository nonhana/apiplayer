import { Exclude, Expose, Transform, Type } from 'class-transformer'
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
export class TeamItemDto {
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
  isActive: boolean

  @Expose()
  createdAt: Date

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

export class TeamDetailDto {}
