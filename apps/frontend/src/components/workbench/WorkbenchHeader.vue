<script lang="ts" setup>
import { ArrowLeft, Settings } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
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

const router = useRouter()

const userStore = useUserStore()
const teamStore = useTeamStore()
const projectStore = useProjectStore()

const { projectDetail } = storeToRefs(projectStore)

const environments = computed(() => projectDetail.value?.environments ?? [])

const curEnvId = ref('')

/** 当前环境 */
const curEnv = computed(() =>
  environments.value.find(e => e.id === curEnvId.value),
)

// 环境列表变更时，设置默认环境
watch(environments, (newV) => {
  // 设置默认环境
  if (!curEnvId.value && newV.length > 0) {
    const defaultEnv = newV.find(e => e.isDefault) ?? newV[0]
    if (defaultEnv) {
      curEnvId.value = defaultEnv.id
    }
  }
}, { immediate: true, deep: true })

// 用户手动切换时的逻辑
watch(curEnvId, async (newV, oldV) => {
  if (!newV || !oldV || newV === oldV)
    return

  try {
    await projectStore.setDefaultEnv(newV)
  }
  catch {
    toast.error('切换环境失败，请稍后再试')
    curEnvId.value = oldV
  }
})
/** 显示名称 */
const displayName = computed(() => userStore.user?.name || userStore.user?.username || '未登录')

/** 头像首字母 */
const avatarInitials = computed(() => {
  const name = displayName.value
  return name.charAt(0).toUpperCase()
})

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
</script>

<template>
  <header class="h-12 border-b border-border flex items-center px-4 bg-background shrink-0">
    <div class="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" />
      </Button>

      <div v-if="!projectDetail" class="flex items-center gap-2">
        <Skeleton class="h-5 w-32" />
      </div>
      <div v-else class="flex items-center gap-2">
        <Avatar class="h-6 w-6 rounded">
          <AvatarImage v-if="projectDetail.icon" :src="projectDetail.icon" />
          <AvatarFallback class="text-xs rounded">
            {{ projectDetail.name.charAt(0).toUpperCase() }}
          </AvatarFallback>
        </Avatar>
        <span class="font-semibold text-sm">{{ projectDetail.name }}</span>
      </div>

      <span class="text-muted-foreground">/</span>

      <Select v-model="curEnvId" :disabled="environments.length === 0">
        <SelectTrigger class="h-7 w-auto min-w-30 text-xs border-dashed">
          <SelectValue placeholder="选择环境">
            <span v-if="curEnv">
              {{ curEnv.name }}
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
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex-1" />

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
