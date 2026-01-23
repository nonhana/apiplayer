import { PermissionType } from '@apiplayer/shared'
import { Exclude, Expose, Type } from 'class-transformer'
import { RoleBriefDto } from '@/common/dto/role.dto'

@Exclude()
export class GetPermissionsResDto {
  @Expose()
  @Type(() => RoleBriefDto)
  role: RoleBriefDto

  @Expose()
  permissions: PermissionType[]
}
