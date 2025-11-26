import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const currentProjectId = ref<string>('')
  const currentTeamId = ref<string>('')
  const currentEnvId = ref<string>('')

  // Global params, cached environment list, etc.
  const globalParams = ref<any[]>([])

  function setCurrentProject(id: string) {
    currentProjectId.value = id
  }

  function setCurrentTeam(id: string) {
    currentTeamId.value = id
  }

  function setEnvironment(id: string) {
    currentEnvId.value = id
  }

  return {
    currentProjectId,
    currentTeamId,
    currentEnvId,
    globalParams,
    setCurrentProject,
    setCurrentTeam,
    setEnvironment,
  }
}, {
  persist: true,
})
