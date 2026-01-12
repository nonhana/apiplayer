import type { TeamInviteMode } from '@/api/util'
import type { RoleItem } from '@/types/role'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roleApi } from '@/api/role'
import { utilApi } from '@/api/util'

// 存一些全局数据
export const useGlobalStore = defineStore('global', () => {
  const teamRoles = ref<RoleItem[]>([])
  const projectRoles = ref<RoleItem[]>([])
  const teamInviteMode = ref<TeamInviteMode>('direct')

  function setTeamRoles(roles: RoleItem[]) {
    teamRoles.value = roles
  }
  function setProjectRoles(roles: RoleItem[]) {
    projectRoles.value = roles
  }

  async function initRoles() {
    if (teamRoles.value.length > 0 && projectRoles.value.length > 0)
      return

    try {
      const [teamRolesResponse, projectRolesResponse] = await Promise.all([
        roleApi.getRoles({ type: 'TEAM' }),
        roleApi.getRoles({ type: 'PROJECT' }),
      ])
      setTeamRoles(teamRolesResponse.roles)
      setProjectRoles(projectRolesResponse.roles)
    }
    catch (error) {
      console.error('初始化角色失败', error)
      throw error
    }
  }

  async function initPublicConfig() {
    try {
      const config = await utilApi.getPublicConfig()
      teamInviteMode.value = config.teamInviteMode
    }
    catch (error) {
      console.error('获取公开配置失败', error)
      // 默认使用 direct 模式
      teamInviteMode.value = 'direct'
    }
  }

  return {
    teamRoles,
    projectRoles,
    teamInviteMode,
    initRoles,
    initPublicConfig,
  }
}, {
  persist: {
    storage: localStorage,
  },
})
