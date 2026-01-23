<script lang="ts" setup>
import { Settings } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
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
import { useUserStore } from '@/stores/useUserStore'

const router = useRouter()

const userStore = useUserStore()
const { user, isAuthenticated } = storeToRefs(userStore)
const { logout } = userStore

const isSettingsDialogOpen = ref(false)
const settingsInitialTab = ref('')

const displayName = computed(() => user?.value?.name || user?.value?.username || '未登录用户')
const displayEmail = computed(() => user?.value?.email || '')

/** 打开设置弹窗并跳转到指定标签 */
function openSettings(tab = '') {
  settingsInitialTab.value = tab
  isSettingsDialogOpen.value = true
}

function goDashboard() {
  router.push({ name: 'Dashboard' })
}
</script>

<template>
  <header class="h-12 border-b border-border flex items-center px-6 sticky top-0 bg-background/95 backdrop-blur z-50">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none" @click="goDashboard">
        <img src="/logo.svg" alt="ApiPlayer" class="w-6 h-6">
        <span class="font-bold tracking-tight">ApiPlayer</span>
      </div>
    </div>

    <div class="ml-auto flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="openSettings()">
        <Settings class="h-4 w-4" />
      </Button>
      <Button
        v-if="!isAuthenticated"
        variant="outline"
        @click="router.push('/auth/login')"
      >
        用户登录
      </Button>
      <DropdownMenu v-else>
        <DropdownMenuTrigger as-child class="cursor-pointer">
          <Avatar class="h-8 w-8 border">
            <AvatarImage v-if="user?.avatar" :src="user?.avatar" />
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
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="logout"
          >
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
  <SettingsDialog v-model:open="isSettingsDialogOpen" :initial-tab="settingsInitialTab" />
</template>
