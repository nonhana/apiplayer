<script lang="ts" setup>
import type { ProjectVisibility } from '@/constants'
import type { ProjectItem } from '@/types/project'
import { FolderKanban, Inbox, Plus, RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { projectApi } from '@/api/project'
import CreateProjectDialog from '@/components/dashboard/CreateProjectDialog.vue'
import DeleteProjectDialog from '@/components/dashboard/DeleteProjectDialog.vue'
import ProjectCard from '@/components/dashboard/ProjectCard.vue'
import RecentProjects from '@/components/dashboard/RecentProjects.vue'
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

// 项目列表状态
const projects = ref<ProjectItem[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const visibilityFilter = ref<ProjectVisibility>('all')

// 对话框状态
const isCreateProjectDialogOpen = ref(false)
const isDeleteProjectDialogOpen = ref(false)
const projectToDelete = ref<ProjectItem | null>(null)

/** 过滤后的项目列表 */
const filteredProjects = computed(() => {
  let result = projects.value

  // 属于当前团队的项目
  if (teamStore.currentTeamId) {
    result = result.filter(p => p.team.id === teamStore.currentTeamId)
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

/** 是否有项目 */
const hasProjects = computed(() => filteredProjects.value.length > 0)

/** 是否显示空状态 */
const showEmptyState = computed(() => !isLoading.value && !hasProjects.value)

/** 当前团队名称 */
const currentTeamName = computed(() => teamStore.currentTeam?.name ?? '所有团队')

/** 获取项目列表 */
async function fetchProjects() {
  isLoading.value = true
  try {
    const response = await projectApi.getProjects({
      limit: 100,
      teamId: teamStore.currentTeamId ?? undefined,
    })
    projects.value = response.projects
  }
  finally {
    isLoading.value = false
  }
}

/** 刷新数据 */
function handleRefresh() {
  fetchProjects()
  recentProjectsRef.value?.refresh()
}

/** 项目创建成功 */
function handleProjectCreated(project: ProjectItem) {
  projects.value.unshift(project)
  recentProjectsRef.value?.refresh()
}

/** 打开编辑项目对话框 */
function handleEditProject(_project: ProjectItem) {
  // TODO: 实现编辑项目功能
}

/** 打开删除项目确认框 */
function handleDeleteProject(project: ProjectItem) {
  projectToDelete.value = project
  isDeleteProjectDialogOpen.value = true
}

/** 项目删除成功 */
function handleProjectDeleted(projectId: string) {
  projects.value = projects.value.filter(p => p.id !== projectId)
  projectToDelete.value = null
  recentProjectsRef.value?.refresh()
}

/** 打开成员管理 */
function handleManageMembers(_project: ProjectItem) {
  // TODO: 实现成员管理功能
}

/** 监听团队变化，重新获取项目 */
watch(
  () => teamStore.currentTeamId,
  () => {
    fetchProjects()
  },
)

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="space-y-6">
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
          <Button size="sm" @click="isCreateProjectDialogOpen = true">
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

      <!-- shadcn 骨架屏 -->
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
          @click="isCreateProjectDialogOpen = true"
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
          @manage-members="handleManageMembers"
        />
      </div>

      <div v-if="!isLoading && hasProjects" class="text-center py-4">
        <p class="text-sm text-muted-foreground">
          共 {{ filteredProjects.length }} 个项目
        </p>
      </div>
    </section>

    <CreateProjectDialog
      v-model:open="isCreateProjectDialogOpen"
      @created="handleProjectCreated"
    />

    <DeleteProjectDialog
      v-model:open="isDeleteProjectDialogOpen"
      :project="projectToDelete"
      @deleted="handleProjectDeleted"
    />
  </div>
</template>
