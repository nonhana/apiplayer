import { Exclude, Expose, Type } from 'class-transformer'
import { PermissionDto } from './permission.dto'

@Exclude()
export class PermissionsDto {
  @Expose() total: number

  @Expose()
  @Type(() => PermissionDto)
  permissions: PermissionDto[]
}
