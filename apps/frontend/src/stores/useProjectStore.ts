import type { ProjectDetail, ProjectEnv, ProjectMember } from '@/types/project'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { projectApi } from '@/api/project'

export const useProjectStore = defineStore('project', () => {
  // State
  const projectId = ref<string>('')
  const isLoading = ref(false) // 首次加载状态
  const isRefreshing = ref(false) // 刷新状态
  const projectDetail = ref<ProjectDetail | null>(null)
  const projectMembers = ref<ProjectMember[]>([])
  const environments = ref<ProjectEnv[]>([])
  const curEnvId = ref<string | null>(null)

  // Setters
  function setProjectId(id: string) {
    projectId.value = id
  }
  function setProjectDetail(detail: ProjectDetail) {
    projectDetail.value = detail
  }
  function setProjectMembers(members: ProjectMember[]) {
    projectMembers.value = members
  }
  function setEnvironments(envs: ProjectEnv[]) {
    environments.value = envs
  }
  function setCurEnvId(id: string | null) {
    curEnvId.value = id
  }

  // Computed
  const curEnv = computed(() => {
    if (!curEnvId.value)
      return null
    return environments.value.find(e => e.id === curEnvId.value) ?? null
  })

  // 获取数据
  async function _fetchData() {
    if (!projectId.value)
      return

    const [detail, members, envs] = await Promise.all([
      projectApi.getProjectDetail(projectId.value),
      projectApi.getAllProjectMembers(projectId.value),
      projectApi.getProjectEnvs(projectId.value),
    ])

    setProjectDetail(detail)
    setProjectMembers(members)
    setEnvironments(envs)

    // effects
    setCurEnvId(envs.find(e => e.isDefault)?.id ?? null)
  }

  async function init() {
    if (!projectId.value)
      return

    isLoading.value = true
    try {
      await _fetchData()
    }
    catch (error) {
      console.error('初始化失败', error)
      throw error
    }
    finally {
      isLoading.value = false
    }
  }

  async function refresh() {
    if (!projectId.value)
      return
    isRefreshing.value = true
    try {
      await _fetchData()
    }
    catch (error) {
      console.error('静默刷新失败', error)
    }
    finally {
      isRefreshing.value = false
    }
  }

  async function setDefaultEnv(envId: string) {
    if (!environments.value.length)
      return

    const targetEnv = environments.value.find(e => e.id === envId)
    const oldDefault = environments.value.find(e => e.isDefault)

    if (oldDefault)
      oldDefault.isDefault = false
    if (targetEnv)
      targetEnv.isDefault = true

    try {
      await projectApi.setDefaultEnv(projectId.value, envId)
      refresh()
    }
    catch (error) {
      if (targetEnv)
        targetEnv.isDefault = false
      if (oldDefault)
        oldDefault.isDefault = true
      throw error
    }
  }

  function reset() {
    projectId.value = ''
    isLoading.value = false
    projectDetail.value = null
    projectMembers.value = []
    environments.value = []
    curEnvId.value = null
  }

  return {
    // states
    projectId,
    isLoading,
    isRefreshing,
    projectDetail,
    projectMembers,
    environments,
    curEnvId,
    curEnv,

    // setters
    setProjectId,
    setProjectMembers,
    setEnvironments,
    setCurEnvId,

    // actions
    init,
    refresh,
    setDefaultEnv,
    reset,
  }
})
