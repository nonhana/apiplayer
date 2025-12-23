import type { TeamItem, TeamMember } from '@/types/team'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { teamApi } from '@/api/team'

export const useTeamStore = defineStore('team', () => {
  /** 用户所有团队列表 */
  const teams = ref<TeamItem[]>([])

  /** 当前选中的团队 ID */
  const curTeamId = ref<string | null>(null)

  /** 当前选中团队的团队成员 */
  const curTeamMembers = ref<TeamMember[]>([])

  /** 是否正在加载团队列表 */
  const isLoading = ref(false)

  /** 当前选中的团队 */
  const curTeam = computed(() =>
    teams.value.find(t => t.id === curTeamId.value) ?? null,
  )

  /** 获取用户的团队列表 */
  async function fetchTeams() {
    isLoading.value = true
    try {
      teams.value = await teamApi.getAllUserTeams()

      // 如果没有选中团队且有团队列表，自动选中第一个
      if (!curTeamId.value && teams.value.length > 0 && teams.value[0]) {
        curTeamId.value = teams.value[0].id
      }
    }
    finally {
      isLoading.value = false
    }
  }

  /** 切换当前团队 */
  async function switchTeam(teamId: string) {
    const team = teams.value.find(t => t.id === teamId)
    if (team) {
      curTeamId.value = teamId
      // 切换团队后，需要获取当前团队的团队成员列表
      await fetchCurTeamMembers()
    }
  }

  /** 添加新团队到列表 */
  function addTeam(team: TeamItem) {
    teams.value.unshift(team)
    // 如果是第一个团队，自动选中
    if (teams.value.length === 1) {
      curTeamId.value = team.id
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
      if (curTeamId.value === teamId) {
        curTeamId.value = teams.value[0]?.id ?? null
      }
    }
  }

  /** 获取当前选中团队的团队成员 */
  async function fetchCurTeamMembers() {
    if (!curTeamId.value)
      return

    curTeamMembers.value = await teamApi.getAllTeamMembers(curTeamId.value)
  }

  /** 重置状态 */
  function reset() {
    teams.value = []
    curTeamId.value = null
    curTeamMembers.value = []
    isLoading.value = false
  }

  return {
    teams,
    curTeamId,
    curTeam,
    isLoading,
    fetchTeams,
    switchTeam,
    addTeam,
    updateTeam,
    removeTeam,
    fetchCurTeamMembers,
    reset,
  }
}, {
  persist: {
    pick: ['curTeamId'],
    storage: localStorage,
  },
})
