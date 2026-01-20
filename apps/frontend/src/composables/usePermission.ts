import type { PermissionType } from '@/constants/permissions'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { roles } from '@/constants/roles'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTeamStore } from '@/stores/useTeamStore'
import { useUserStore } from '@/stores/useUserStore'

/**
 * 权限检查 composable
 *
 * 基于用户在当前项目/团队中的角色来判断是否有指定权限
 */
export function usePermission() {
  const userStore = useUserStore()
  const teamStore = useTeamStore()
  const projectStore = useProjectStore()

  const { user } = storeToRefs(userStore)
  const { curTeam } = storeToRefs(teamStore)
  const { projectDetail } = storeToRefs(projectStore)

  /** 当前用户在项目中的角色名 */
  const projectRoleName = computed(() => projectDetail.value?.currentUserRole?.name)

  /** 当前用户在团队中的角色名 */
  const teamRoleName = computed(() => curTeam.value?.currentUserRole?.name)

  /** 获取用户拥有的所有权限（合并项目角色和团队角色的权限） */
  const userPermissions = computed(() => {
    const permissions = new Set<string>()

    // 从项目角色获取权限
    if (projectRoleName.value) {
      const projectRole = roles.find(r => r.name === projectRoleName.value)
      if (projectRole) {
        projectRole.permissions.forEach(p => permissions.add(p))
      }
    }

    // 从团队角色获取权限（团队角色通常具有更高的权限）
    if (teamRoleName.value) {
      const teamRole = roles.find(r => r.name === teamRoleName.value)
      if (teamRole) {
        teamRole.permissions.forEach(p => permissions.add(p))
      }
    }

    return permissions
  })

  /** 检查是否有指定权限 */
  function hasPermission(permission: PermissionType): boolean {
    return userPermissions.value.has(permission)
  }

  /** 检查是否有任一指定权限 */
  function hasAnyPermission(permissions: PermissionType[]): boolean {
    return permissions.some(p => userPermissions.value.has(p))
  }

  /** 检查是否有全部指定权限 */
  function hasAllPermissions(permissions: PermissionType[]): boolean {
    return permissions.every(p => userPermissions.value.has(p))
  }

  /** 是否有发布 API 的权限 */
  const canPublishApi = computed(() => hasPermission('api:publish'))

  /** 是否有管理版本的权限 */
  const canManageVersion = computed(() => hasPermission('api:version:manage'))

  /** 是否是系统管理员 */
  const isAdmin = computed(() => user.value?.isAdmin ?? false)

  return {
    projectRoleName,
    teamRoleName,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPublishApi,
    canManageVersion,
    isAdmin,
  }
}
