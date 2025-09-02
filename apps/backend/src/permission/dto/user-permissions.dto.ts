import { PermissionType } from '@/constants/permission'
import { RoleType } from '@/constants/role'
import { PermissionContextDto } from './permission-context.dto'

export class UserPermissionsDto {
  userId: string
  context: PermissionContextDto
  roles: RoleType[]
  permissions: PermissionType[]
}
