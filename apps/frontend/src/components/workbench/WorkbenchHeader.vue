<script lang="ts" setup>
import { ArrowLeft, Settings } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ModeToggle from '@/components/common/ModeToggle.vue'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getAbbreviation } from '@/lib/utils'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTeamStore } from '@/stores/useTeamStore'
import { useUserStore } from '@/stores/useUserStore'
import ProjectSettingsSheet from './ProjectSettingsSheet.vue'

const router = useRouter()

const userStore = useUserStore()
const teamStore = useTeamStore()

const projectStore = useProjectStore()
const { projectDetail, environments, curEnvId, curEnv } = storeToRefs(projectStore)
const { setCurEnvId } = projectStore

const displayName = computed(() => userStore.user?.name || userStore.user?.username || '未登录')

const isSettingsSheetOpen = ref(false)
const isSettingsDialogOpen = ref(false)
const settingsInitialTab = ref('')

function goBack() {
  router.push({ name: 'Dashboard' })
}

/** 打开设置弹窗并跳转到指定标签 */
function openSettings(tab = '') {
  settingsInitialTab.value = tab
  isSettingsDialogOpen.value = true
}

function handleLogout() {
  teamStore.reset()
  userStore.logout()
  router.push('/auth/login')
}
</script>

<template>
  <header class="h-14 border-b border-border flex items-center px-4 bg-background shrink-0">
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
            {{ getAbbreviation(projectDetail.name, 'P') }}
          </AvatarFallback>
        </Avatar>
        <span class="font-semibold text-sm">{{ projectDetail.name }}</span>
      </div>

      <span class="text-muted-foreground">/</span>

      <Select
        :disabled="environments.length === 0"
        :model-value="curEnvId"
        @update:model-value="setCurEnvId($event as string)"
      >
        <SelectTrigger class="h-7 w-auto min-w-30 text-xs border-dashed">
          <SelectValue placeholder="选择环境">
            <span v-if="curEnv">{{ curEnv.name }}</span>
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
      <ModeToggle />
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :disabled="!projectDetail"
        @click="isSettingsSheetOpen = true"
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
                {{ getAbbreviation(displayName, 'U') }}
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

    <ProjectSettingsSheet
      v-if="projectDetail"
      v-model:open="isSettingsSheetOpen"
      :project="projectDetail"
    />
    <SettingsDialog v-model:open="isSettingsDialogOpen" :initial-tab="settingsInitialTab" />
  </header>
</template>
