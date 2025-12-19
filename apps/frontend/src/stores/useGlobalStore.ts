import type { RoleItem } from '@/types/role'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roleApi } from '@/api/role'

// 存一些全局数据
export const useGlobalStore = defineStore('global', () => {
  const projectRoles = ref<RoleItem[]>([])

  function setProjectRoles(roles: RoleItem[]) {
    projectRoles.value = roles
  }

  async function initProjectRoles() {
    if (projectRoles.value.length > 0)
      return

    try {
      const response = await roleApi.getRoles({ type: 'PROJECT' })
      setProjectRoles(response.roles)
    }
    catch (error) {
      console.error('初始化项目角色失败', error)
      throw error
    }
  }

  return {
    projectRoles,
    initProjectRoles,
  }
}, {
  persist: {
    storage: localStorage,
  },
})
