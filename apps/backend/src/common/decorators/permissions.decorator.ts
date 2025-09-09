import { SetMetadata } from '@nestjs/common'
import { PermissionContextConfig, PermissionContextParamName } from '@/common/types/permission'
import { PermissionType } from '@/constants/permission'

export const CONTEXT_PERMISSIONS_KEY = 'contextPermissions'
export const TEAM_CONTEXT_KEY = 'teamContext'
export const PROJECT_CONTEXT_KEY = 'projectContext'
export const SYSTEM_CONTEXT_KEY = 'systemContext'

/**
 * 上下文权限装饰器
 */
export function ContextPermissions(config: PermissionContextConfig) {
  return SetMetadata(CONTEXT_PERMISSIONS_KEY, config)
}

/**
 * 团队上下文权限装饰器
 */
export function TeamPermissions(permissions: PermissionType[], paramName: PermissionContextParamName = 'teamId') {
  return SetMetadata(CONTEXT_PERMISSIONS_KEY, {
    type: 'team',
    paramName,
    permissions,
  })
}

/**
 * 项目上下文权限装饰器
 */
export function ProjectPermissions(permissions: PermissionType[], paramName: PermissionContextParamName = 'projectId') {
  return SetMetadata(CONTEXT_PERMISSIONS_KEY, {
    type: 'project',
    paramName,
    permissions,
  })
}

/**
 * 检查用户是否是团队成员
 */
export function RequireTeamMember(paramName: PermissionContextParamName = 'teamId') {
  return SetMetadata(TEAM_CONTEXT_KEY, { paramName })
}

/**
 * 检查用户是否是项目成员
 */
export function RequireProjectMember(paramName: PermissionContextParamName = 'projectId') {
  return SetMetadata(PROJECT_CONTEXT_KEY, { paramName })
}

/**
 * 检查用户是否是系统管理员
 */
export function RequireSystemAdmin() {
  return SetMetadata(SYSTEM_CONTEXT_KEY, true)
}
