<script lang="ts" setup>
import type { ProjectDetail, ProjectEnv } from '@/types/project'
import { ArrowLeft, Settings } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectApi } from '@/api/project'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTeamStore } from '@/stores/useTeamStore'
import { useUserStore } from '@/stores/useUserStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const teamStore = useTeamStore()
const projectStore = useProjectStore()

/** 项目 ID */
const projectId = computed(() => route.params.projectId as string)

/** 项目详情 */
const project = ref<ProjectDetail | null>(null)

/** 加载状态 */
const isLoading = ref(false)

/** 当前选中的环境 */
const currentEnvId = computed({
  get: () => projectStore.currentEnvId,
  set: (val) => {
    projectStore.setEnvironment(val)
  },
})

/** 环境列表 */
const environments = computed(() => project.value?.environments ?? [])

/** 当前环境 */
const currentEnv = computed(() =>
  environments.value.find(e => e.id === currentEnvId.value),
)

/** 显示名称 */
const displayName = computed(() => userStore.user?.name || userStore.user?.username || '未登录')

/** 头像首字母 */
const avatarInitials = computed(() => {
  const name = displayName.value
  return name.charAt(0).toUpperCase()
})

/** 获取项目详情 */
async function fetchProject() {
  if (!projectId.value)
    return

  isLoading.value = true
  try {
    project.value = await projectApi.getProjectDetail(projectId.value)
    projectStore.setCurrentProject(projectId.value)

    // 设置默认环境
    if (!currentEnvId.value && project.value.environments.length > 0) {
      const defaultEnv = project.value.environments.find(e => e.isDefault)
        ?? project.value.environments[0]
      if (defaultEnv) {
        currentEnvId.value = defaultEnv.id
      }
    }
  }
  finally {
    isLoading.value = false
  }
}

/** 返回仪表盘 */
function goBack() {
  router.push({ name: 'Dashboard' })
}

/** 个人资料 */
function goProfile() {
  router.push({ name: 'UserProfile' })
}

/** 退出登录 */
function handleLogout() {
  teamStore.reset()
  userStore.logout()
  router.push('/auth/login')
}

/** 环境类型对应的标签 */
function getEnvTypeLabel(type: ProjectEnv['type']) {
  const labels: Record<ProjectEnv['type'], string> = {
    DEV: '开发',
    TEST: '测试',
    STAGING: '预发',
    PROD: '生产',
  }
  return labels[type]
}

onMounted(() => {
  fetchProject()
})
</script>

<template>
  <header class="h-12 border-b border-border flex items-center px-4 bg-background shrink-0">
    <!-- 左侧：返回 + 项目信息 -->
    <div class="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" />
      </Button>

      <div v-if="isLoading" class="flex items-center gap-2">
        <Skeleton class="h-5 w-32" />
      </div>
      <div v-else-if="project" class="flex items-center gap-2">
        <Avatar class="h-6 w-6 rounded">
          <AvatarImage v-if="project.icon" :src="project.icon" />
          <AvatarFallback class="text-xs rounded">
            {{ project.name.charAt(0).toUpperCase() }}
          </AvatarFallback>
        </Avatar>
        <span class="font-semibold text-sm">{{ project.name }}</span>
      </div>

      <span class="text-muted-foreground">/</span>

      <!-- 环境选择器 -->
      <Select v-model="currentEnvId" :disabled="environments.length === 0">
        <SelectTrigger class="h-7 w-auto min-w-[100px] text-xs border-dashed">
          <SelectValue placeholder="选择环境">
            <span v-if="currentEnv">
              {{ currentEnv.name }}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="env in environments"
            :key="env.id"
            :value="env.id"
          >
            <div class="flex items-center gap-2">
              <span>{{ env.name }}</span>
              <span class="text-[10px] text-muted-foreground">
                ({{ getEnvTypeLabel(env.type) }})
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex-1" />

    <!-- 右侧：设置 + 用户菜单 -->
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
      >
        <Settings class="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
          >
            <Avatar class="h-7 w-7 border">
              <AvatarImage v-if="userStore.user?.avatar" :src="userStore.user.avatar" />
              <AvatarFallback class="text-xs">
                {{ avatarInitials }}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuLabel>
            <span class="text-xs">{{ displayName }}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="goBack">
            返回工作台
          </DropdownMenuItem>
          <DropdownMenuItem @click="goProfile">
            个人资料
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="handleLogout"
          >
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
