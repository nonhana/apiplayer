import type { RoleItem } from '@/types/role'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roleApi } from '@/api/role'

// 存一些全局数据
export const useGlobalStore = defineStore('global', () => {
  const teamRoles = ref<RoleItem[]>([])
  const projectRoles = ref<RoleItem[]>([])

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

  return {
    teamRoles,
    projectRoles,
    initRoles,
  }
}, {
  persist: {
    storage: localStorage,
  },
})
