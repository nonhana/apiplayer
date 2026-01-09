<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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
import ModeToggle from '../common/ModeToggle.vue'
import CreateTeamDialog from './dialogs/CreateTeamDialog.vue'
import TeamSwitcher from './TeamSwitcher.vue'

const router = useRouter()
const userStore = useUserStore()
const teamStore = useTeamStore()

const isCreateTeamDialogOpen = ref(false)

const displayName = computed(() => userStore.user?.name || userStore.user?.username || '未登录用户')
const displayEmail = computed(() => userStore.user?.email || '')

function goProfile() {
  router.push({ name: 'UserProfile' })
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
        <span class="text-xs text-muted-foreground hidden sm:inline-flex">
          Modern API Workspace
        </span>
      </div>

      <div class="h-6 w-px bg-border hidden sm:block" />

      <TeamSwitcher @create-team="isCreateTeamDialogOpen = true" />
    </div>

    <div class="ml-auto flex items-center gap-4">
      <ModeToggle />
      <Button
        v-if="!userStore.isAuthenticated"
        variant="outline"
        @click="router.push('/auth/login')"
      >
        用户登录
      </Button>
      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            class="flex items-center gap-2 px-2"
          >
            <div class="hidden sm:flex flex-col items-end leading-tight mr-1">
              <span class="text-xs font-medium">
                {{ displayName }}
              </span>
              <span class="text-[10px] text-muted-foreground truncate max-w-35">
                {{ displayEmail }}
              </span>
            </div>
            <Avatar class="h-8 w-8 border">
              <AvatarImage v-if="userStore.user?.avatar" :src="userStore.user.avatar" />
              <AvatarFallback class="text-xs font-semibold">
                {{ getAbbreviation(displayName, 'U') }}
              </AvatarFallback>
            </Avatar>
          </Button>
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
  <CreateTeamDialog v-model:open="isCreateTeamDialogOpen" />
</template>
