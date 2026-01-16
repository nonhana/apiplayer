<script lang="ts" setup>
import type { ProjectVisibility } from '@/constants'
import type { ProjectItem } from '@/types/project'
import { FolderKanban, Inbox, Plus, RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { projectApi } from '@/api/project'
import CreateTeamDialog from '@/components/dashboard/dialogs/CreateTeamDialog.vue'
import DeleteProjectDialog from '@/components/dashboard/dialogs/DeleteProjectDialog.vue'
import ProjectFormDialog from '@/components/dashboard/dialogs/ProjectFormDialog.vue'
import ProjectCard from '@/components/dashboard/ProjectCard.vue'
import RecentProjects from '@/components/dashboard/RecentProjects.vue'
import TeamPlaceholder from '@/components/dashboard/TeamPlaceholder.vue'
import TeamSidebar from '@/components/dashboard/TeamSidebar.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamStore } from '@/stores/useTeamStore'

const teamStore = useTeamStore()
const recentProjectsRef = useTemplateRef('recentProjectsRef')

const projects = ref<ProjectItem[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const visibilityFilter = ref<ProjectVisibility>('all')

const isProjectFormDialogOpen = ref(false)
const projectFormMode = ref<'create' | 'edit'>('create')
const isDeleteProjectDialogOpen = ref(false)
const isCreateTeamDialogOpen = ref(false)

const showTeamPlaceholder = computed(() =>
  teamStore.isLoading || teamStore.teams.length === 0 || !teamStore.curTeamId,
)

// 当前操作的项目
const currentProject = ref<ProjectItem | null>(null)
const projectToDelete = ref<ProjectItem | null>(null)

const filteredProjects = computed(() => {
  let result = projects.value

  // 属于当前团队的项目
  if (teamStore.curTeamId) {
    result = result.filter(p => p.team.id === teamStore.curTeamId)
  }

  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query)
      || p.description?.toLowerCase().includes(query)
      || p.slug.toLowerCase().includes(query),
    )
  }

  // 按可见性过滤
  if (visibilityFilter.value === 'public') {
    result = result.filter(p => p.isPublic)
  }
  else if (visibilityFilter.value === 'private') {
    result = result.filter(p => !p.isPublic)
  }

  return result
})

const hasProjects = computed(() => filteredProjects.value.length > 0)
const showEmptyState = computed(() => !isLoading.value && !hasProjects.value)
const currentTeamName = computed(() => teamStore.curTeam?.name ?? '所有团队')

async function fetchProjects() {
  isLoading.value = true
  try {
    projects.value = await projectApi.getAllUserProjects()
  }
  catch (error) {
    console.error('获取用户项目列表失败', error)
  }
  finally {
    isLoading.value = false
  }
}

function handleRefresh() {
  fetchProjects()
  recentProjectsRef.value?.refresh()
}

function openCreateProjectDialog() {
  projectFormMode.value = 'create'
  currentProject.value = null
  isProjectFormDialogOpen.value = true
}

function handleEditProject(project: ProjectItem) {
  projectFormMode.value = 'edit'
  currentProject.value = project
  isProjectFormDialogOpen.value = true
}

function handleProjectFormSuccess(project: ProjectItem) {
  if (projectFormMode.value === 'create') {
    // 创建成功，添加到列表头部
    projects.value.unshift(project)
    recentProjectsRef.value?.refresh()
  }
  else {
    // 编辑成功，更新列表中的项目
    const index = projects.value.findIndex(p => p.id === project.id)
    if (index !== -1) {
      projects.value[index] = project
    }
  }
  currentProject.value = null
}

function handleDeleteProject(project: ProjectItem) {
  projectToDelete.value = project
  isDeleteProjectDialogOpen.value = true
}

function handleProjectDeleted(projectId: string) {
  projects.value = projects.value.filter(p => p.id !== projectId)
  projectToDelete.value = null
  recentProjectsRef.value?.refresh()
}

watch(
  () => teamStore.curTeamId,
  () => {
    fetchProjects()
  },
)

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="flex min-h-[calc(100dvh-3.5rem)]">
    <TeamSidebar @create-team="isCreateTeamDialogOpen = true" />

    <div class="flex-1">
      <div class="space-y-6 p-6 container mx-auto">
        <TeamPlaceholder
          v-if="showTeamPlaceholder"
          @create-team="isCreateTeamDialogOpen = true"
        />

        <template v-else>
          <RecentProjects ref="recentProjectsRef" />

          <section class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex items-center gap-3">
                <FolderKanban class="h-6 w-6 text-primary" />
                <div>
                  <h1 class="text-xl font-bold">
                    项目列表
                  </h1>
                  <p class="text-sm text-muted-foreground">
                    {{ currentTeamName }} 的所有项目
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="isLoading"
                  @click="handleRefresh"
                >
                  <RefreshCw class="h-4 w-4 mr-1" :class="{ 'animate-spin': isLoading }" />
                  刷新
                </Button>
                <Button size="sm" @click="openCreateProjectDialog">
                  <Plus class="h-4 w-4 mr-1" />
                  新建项目
                </Button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative flex-1 max-w-sm">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="搜索项目名称或描述..."
                  class="pl-9"
                />
              </div>
              <Select v-model="visibilityFilter">
                <SelectTrigger class="w-[140px]">
                  <SelectValue placeholder="可见性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    全部
                  </SelectItem>
                  <SelectItem value="public">
                    公开项目
                  </SelectItem>
                  <SelectItem value="private">
                    私有项目
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="i in 6"
                :key="i"
                class="p-4 rounded-lg border bg-card"
              >
                <div class="flex items-start gap-3 mb-3">
                  <Skeleton class="h-12 w-12 rounded-lg" />
                  <div class="flex-1 space-y-2">
                    <Skeleton class="h-5 w-32" />
                    <Skeleton class="h-4 w-20" />
                  </div>
                </div>
                <Skeleton class="h-4 w-full mb-2" />
                <Skeleton class="h-4 w-3/4 mb-4" />
                <div class="flex gap-4">
                  <Skeleton class="h-4 w-16" />
                  <Skeleton class="h-4 w-16" />
                </div>
              </div>
            </div>

            <div
              v-else-if="showEmptyState"
              class="flex flex-col items-center justify-center py-16 px-4 border border-dashed rounded-lg bg-muted/20"
            >
              <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox class="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 class="text-lg font-semibold mb-1">
                暂无项目
              </h3>
              <p class="text-sm text-muted-foreground text-center max-w-sm mb-4">
                {{ searchQuery ? '没有找到匹配的项目，请尝试其他关键词' : '在此团队下创建第一个项目，开始管理您的 API' }}
              </p>
              <Button
                v-if="!searchQuery"
                @click="openCreateProjectDialog"
              >
                <Plus class="h-4 w-4 mr-1" />
                创建第一个项目
              </Button>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ProjectCard
                v-for="project in filteredProjects"
                :key="project.id"
                :project="project"
                @edit="handleEditProject"
                @delete="handleDeleteProject"
              />
            </div>

            <div v-if="!isLoading && hasProjects" class="text-center py-4">
              <p class="text-sm text-muted-foreground">
                共 {{ filteredProjects.length }} 个项目
              </p>
            </div>
          </section>

          <ProjectFormDialog
            v-model:open="isProjectFormDialogOpen"
            :mode="projectFormMode"
            :project="currentProject"
            @success="handleProjectFormSuccess"
          />

          <DeleteProjectDialog
            v-model:open="isDeleteProjectDialogOpen"
            :project="projectToDelete"
            @deleted="handleProjectDeleted"
          />
        </template>

        <CreateTeamDialog v-model:open="isCreateTeamDialogOpen" />
      </div>
    </div>
  </div>
</template>
