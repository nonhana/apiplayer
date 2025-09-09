import type { RoleCategory } from '@/constants/role'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { PermissionDto } from '@/permission/dto/permission.dto'

@Exclude()
export class RoleDto {
  @Expose()
  id: string

  @Expose()
  name: string

  @Expose()
  @Transform(({ value }) => (value !== null ? value : undefined), { toPlainOnly: true })
  description?: string

  @Expose()
  type: RoleCategory

  @Expose()
  createdAt: Date

  @Expose()
  updatedAt: Date

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.rolePermissions || !Array.isArray(obj.rolePermissions)) {
      return undefined
    }

    return obj.rolePermissions.map((rp: any) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
      resource: rp.permission.resource,
      action: rp.permission.action,
    }))
  }, { toClassOnly: true })
  @Type(() => PermissionDto)
  permissions?: PermissionDto[]
}

@Exclude()
export class RolesDto {
  @Expose()
  @Type(() => RoleDto)
  roles: RoleDto[]

  @Expose()
  total: number
}
