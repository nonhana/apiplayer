import { Exclude, Expose, Type } from 'class-transformer'
import { RoleBriefDto } from '@/common/dto/role.dto'
import { PermissionType } from '@/constants/permission'

@Exclude()
export class GetPermissionsResDto {
  @Expose()
  @Type(() => RoleBriefDto)
  role: RoleBriefDto

  @Expose()
  permissions: PermissionType[]
}
