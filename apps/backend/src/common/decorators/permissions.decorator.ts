import { SetMetadata } from '@nestjs/common'
import { PermissionType } from '@/constants/permission'

export const PERMISSIONS_KEY = 'permissions'

/**
 * 权限装饰器，用于声明某个 Controller 方法需要哪些权限
 *
 * @param permissions 权限名称数组
 */
export const Permissions = (...permissions: PermissionType[]) => SetMetadata(PERMISSIONS_KEY, permissions)
