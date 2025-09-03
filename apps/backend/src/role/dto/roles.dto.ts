import { Exclude, Expose, Type } from 'class-transformer'
import { RoleDto } from './role.dto'

@Exclude()
export class RolesDto {
  @Expose()
  @Type(() => RoleDto)
  roles: RoleDto[]

  @Expose()
  total: number
}
