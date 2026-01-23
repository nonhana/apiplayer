<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { Plus, Search } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeamStore } from '@/stores/useTeamStore'
import { useUserStore } from '@/stores/useUserStore'
import TeamSettingsSheet from './TeamSettingsSheet.vue'
import TeamSidebarItem from './TeamSidebarItem.vue'

const emits = defineEmits<{
  (e: 'createTeam'): void
}>()

const teamStore = useTeamStore()
const userStore = useUserStore()

const searchQuery = ref('')
const isTeamSettingsOpen = ref(false)
const selectedTeamForSettings = ref<TeamItem | null>(null)

const filteredTeams = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return teamStore.teams
  }
  return teamStore.teams.filter(team =>
    team.name.toLowerCase().includes(query),
  )
})

async function handleSelectTeam(teamId: string) {
  await teamStore.switchTeam(teamId)
}

function handleOpenTeamSettings(team: TeamItem, event: Event) {
  event.stopPropagation()
  selectedTeamForSettings.value = team
  isTeamSettingsOpen.value = true
}

watch(
  () => teamStore.teams.length,
  (newV) => {
    if (newV === 0 && !teamStore.isLoading && userStore.isAuthenticated) {
      teamStore.fetchTeams()
    }
  },
  { immediate: true },
)
</script>

<template>
  <aside class="w-64 shrink-0 border-r bg-muted/30">
    <div class="flex h-full flex-col">
      <div class="px-4 py-4 border-b space-y-1">
        <div class="text-sm font-semibold">
          我的团队
        </div>
        <p class="text-xs text-muted-foreground">
          管理与切换团队
        </p>
      </div>

      <div class="px-4 py-3">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="搜索团队..."
            class="h-8 pl-8"
          />
        </div>
      </div>

      <ScrollArea class="flex-1 px-2 pb-2">
        <div v-if="teamStore.isLoading" class="space-y-2 px-2">
          <div v-for="i in 6" :key="i" class="flex items-center gap-3 rounded-md px-2 py-2">
            <Skeleton class="h-8 w-8 rounded-full" />
            <div class="flex-1 space-y-1">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-3 w-16" />
            </div>
          </div>
        </div>

        <div
          v-else-if="filteredTeams.length === 0"
          class="px-4 py-8 text-center text-xs text-muted-foreground"
        >
          {{ searchQuery ? '没有找到匹配的团队' : '你还没有加入任何团队' }}
        </div>

        <div v-else class="space-y-1 px-2">
          <TeamSidebarItem
            v-for="team in filteredTeams"
            :key="team.id"
            :team="team"
            @select-team="handleSelectTeam"
            @open-team-settings="handleOpenTeamSettings"
          />
        </div>
      </ScrollArea>

      <div class="border-t p-4">
        <Button class="w-full" @click="emits('createTeam')">
          <Plus class="h-4 w-4 mr-1" />
          创建团队
        </Button>
      </div>
    </div>

    <TeamSettingsSheet
      v-if="selectedTeamForSettings"
      v-model:open="isTeamSettingsOpen"
      :team="selectedTeamForSettings"
    />
  </aside>
</template>
