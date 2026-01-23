<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { ROLE_NAME } from '@apiplayer/shared'
import {
  Settings,
  Users,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { getAbbreviation } from '@/lib/utils'
import TeamBasicInfoTab from './TeamBasicInfoTab.vue'
import TeamMemberTab from './TeamMemberTab.vue'

const props = defineProps<{
  team: TeamItem
}>()

type TabType = 'info' | 'members'

const isOpen = defineModel<boolean>('open', { required: true })

/** 当前用户是否为管理员（owner 或 admin） */
const isAdmin = computed(() => {
  const roleName = props.team.currentUserRole?.name
  return roleName === ROLE_NAME.TEAM_OWNER || roleName === ROLE_NAME.TEAM_ADMIN
})

/** 当前用户是否为所有者 */
const isOwner = computed(() =>
  props.team.currentUserRole?.name === ROLE_NAME.TEAM_OWNER,
)

const activeTab = ref<TabType>('info')

watch(isOpen, (open) => {
  if (open) {
    activeTab.value = 'info'
  }
}, { immediate: true })
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent class="sm:max-w-135 flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4">
        <div class="flex items-center gap-3">
          <Avatar class="h-12 w-12 border-2">
            <AvatarImage v-if="team.avatar" :src="team.avatar" />
            <AvatarFallback class="text-lg font-semibold bg-primary/10 text-primary">
              {{ getAbbreviation(team.name, 'T') }}
            </AvatarFallback>
          </Avatar>
          <div>
            <SheetTitle class="text-lg">
              {{ team.name }}
            </SheetTitle>
            <SheetDescription>
              管理团队信息和成员
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="mx-6 grid w-auto grid-cols-2">
          <TabsTrigger value="info" class="gap-2">
            <Settings class="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="members" class="gap-2">
            <Users class="h-4 w-4" />
            成员管理
            <span class="ml-1 text-xs text-muted-foreground">
              ({{ team.memberCount }})
            </span>
          </TabsTrigger>
        </TabsList>

        <TeamBasicInfoTab
          :team="team"
          :is-admin="isAdmin"
          :is-owner="isOwner"
          @deleted="isOpen = false"
        />

        <TeamMemberTab
          :team="team"
          :is-admin="isAdmin"
          :is-owner="isOwner"
        />
      </Tabs>
    </SheetContent>
  </Sheet>
</template>
