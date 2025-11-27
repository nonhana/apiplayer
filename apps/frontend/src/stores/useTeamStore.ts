import type { TeamItem } from '@/types/team'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { teamApi } from '@/api/team'

export const useTeamStore = defineStore('team', () => {
  /** 用户所有团队列表 */
  const teams = ref<TeamItem[]>([])

  /** 当前选中的团队 ID */
  const currentTeamId = ref<string | null>(null)

  /** 是否正在加载团队列表 */
  const isLoading = ref(false)

  /** 当前选中的团队 */
  const currentTeam = computed(() =>
    teams.value.find(t => t.id === currentTeamId.value) ?? null,
  )

  /** 获取用户的团队列表 */
  async function fetchTeams() {
    isLoading.value = true
    try {
      const response = await teamApi.getTeams({ limit: 100 })
      teams.value = response.teams

      // 如果没有选中团队且有团队列表，自动选中第一个
      if (!currentTeamId.value && response.teams.length > 0 && response.teams[0]) {
        currentTeamId.value = response.teams[0].id
      }
    }
    finally {
      isLoading.value = false
    }
  }

  /** 切换当前团队 */
  function switchTeam(teamId: string) {
    const team = teams.value.find(t => t.id === teamId)
    if (team) {
      currentTeamId.value = teamId
    }
  }

  /** 添加新团队到列表 */
  function addTeam(team: TeamItem) {
    teams.value.unshift(team)
    // 如果是第一个团队，自动选中
    if (teams.value.length === 1) {
      currentTeamId.value = team.id
    }
  }

  /** 更新团队信息 */
  function updateTeam(teamId: string, updates: Partial<TeamItem>) {
    const index = teams.value.findIndex(t => t.id === teamId)
    const existingTeam = teams.value[index]
    if (index !== -1 && existingTeam) {
      teams.value[index] = { ...existingTeam, ...updates }
    }
  }

  /** 从列表中移除团队 */
  function removeTeam(teamId: string) {
    const index = teams.value.findIndex(t => t.id === teamId)
    if (index !== -1) {
      teams.value.splice(index, 1)
      // 如果删除的是当前选中的团队，切换到第一个
      if (currentTeamId.value === teamId) {
        currentTeamId.value = teams.value[0]?.id ?? null
      }
    }
  }

  /** 重置状态 */
  function reset() {
    teams.value = []
    currentTeamId.value = null
    isLoading.value = false
  }

  return {
    teams,
    currentTeamId,
    currentTeam,
    isLoading,
    fetchTeams,
    switchTeam,
    addTeam,
    updateTeam,
    removeTeam,
    reset,
  }
}, {
  persist: {
    pick: ['currentTeamId'],
    storage: localStorage,
  },
})
