import { PermissionType } from '@/constants/permission'
import { RoleType } from '@/constants/role'

export class UserPermissions {
  userId: string
  context: PermissionContext
  roles: RoleType[]
  permissions: PermissionType[]
}

export class PermissionContext {
  type: 'team' | 'project' | 'system'
  id?: string // teamId or projectId
}
