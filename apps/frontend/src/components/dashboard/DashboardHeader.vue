<script lang="ts" setup>
import { Settings } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SettingsDialog from '@/components/settings/SettingsDialog.vue'
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
import { getAbbreviation } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'
import { useUserStore } from '@/stores/useUserStore'
import CreateTeamDialog from './dialogs/CreateTeamDialog.vue'
import TeamSwitcher from './TeamSwitcher.vue'

const router = useRouter()
const userStore = useUserStore()
const teamStore = useTeamStore()

const isCreateTeamDialogOpen = ref(false)
const isSettingsDialogOpen = ref(false)
const settingsInitialTab = ref('')

const displayName = computed(() => userStore.user?.name || userStore.user?.username || '未登录用户')
const displayEmail = computed(() => userStore.user?.email || '')

/** 打开设置弹窗并跳转到指定标签 */
function openSettings(tab = '') {
  settingsInitialTab.value = tab
  isSettingsDialogOpen.value = true
}

function goDashboard() {
  router.push({ name: 'Dashboard' })
}

function handleLogout() {
  teamStore.reset()
  userStore.logout()
  router.push('/auth/login')
}

onMounted(() => {
  if (teamStore.teams.length === 0 && userStore.isAuthenticated) {
    teamStore.fetchTeams()
  }
})
</script>

<template>
  <header class="h-14 border-b border-border flex items-center px-6 sticky top-0 bg-background/95 backdrop-blur z-50">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 cursor-pointer" @click="goDashboard">
        <span class="font-bold text-lg tracking-tight">ApiPlayer</span>
      </div>

      <div class="h-6 w-px bg-border hidden sm:block" />

      <TeamSwitcher @create-team="isCreateTeamDialogOpen = true" />
    </div>

    <div class="ml-auto flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="openSettings()">
        <Settings class="h-4 w-4" />
      </Button>
      <Button
        v-if="!userStore.isAuthenticated"
        variant="outline"
        @click="router.push('/auth/login')"
      >
        用户登录
      </Button>
      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child class="cursor-pointer">
          <Avatar class="h-8 w-8 border">
            <AvatarImage v-if="userStore.user?.avatar" :src="userStore.user.avatar" />
            <AvatarFallback class="text-xs font-semibold">
              {{ getAbbreviation(displayName, 'U') }}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
          <DropdownMenuLabel class="flex flex-col gap-0.5">
            <span class="text-xs font-medium">
              {{ displayName }}
            </span>
            <span class="text-[11px] text-muted-foreground truncate">
              {{ displayEmail || '未绑定邮箱' }}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="goDashboard">
            工作台
          </DropdownMenuItem>
          <DropdownMenuItem @click="openSettings('profile')">
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
  <CreateTeamDialog v-model:open="isCreateTeamDialogOpen" />
  <SettingsDialog v-model:open="isSettingsDialogOpen" :initial-tab="settingsInitialTab" />
</template>
