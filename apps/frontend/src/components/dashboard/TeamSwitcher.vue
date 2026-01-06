<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { ChevronsUpDown, Plus } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { getAbbreviation } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'
import { useUserStore } from '@/stores/useUserStore'
import TeamSettingsSheet from './TeamSettingsSheet.vue'
import TeamSwitcherItem from './TeamSwitcherItem.vue'

const emits = defineEmits<{
  (e: 'createTeam'): void
}>()

const teamStore = useTeamStore()
const userStore = useUserStore()

const isOpen = ref(false)

const isTeamSettingsOpen = ref(false)
const selectedTeamForSettings = ref<TeamItem | null>(null)

const currentTeamName = computed(() => teamStore.curTeam?.name ?? '选择团队')
const currentTeamFallbackIcon = computed(() => getAbbreviation(teamStore.curTeam?.name ?? '', 'T'))

async function handleSelectTeam(teamId: string) {
  await teamStore.switchTeam(teamId)
  isOpen.value = false
}

function handleCreateTeam() {
  isOpen.value = false
  emits('createTeam')
}

function handleOpenTeamSettings(team: TeamItem, event: Event) {
  event.stopPropagation()
  isOpen.value = false
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
  <div class="hidden sm:flex">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="isOpen"
          class="w-50 justify-between gap-2"
        >
          <template v-if="teamStore.isLoading">
            <Skeleton class="h-5 w-5 rounded-full" />
            <Skeleton class="h-4 flex-1" />
          </template>
          <template v-else>
            <Avatar class="h-5 w-5 border">
              <AvatarImage v-if="teamStore.curTeam?.avatar" :src="teamStore.curTeam.avatar" />
              <AvatarFallback class="text-[10px] font-semibold bg-primary/10 text-primary">
                {{ currentTeamFallbackIcon }}
              </AvatarFallback>
            </Avatar>
            <span class="flex-1 truncate text-left font-medium">{{ currentTeamName }}</span>
            <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
          </template>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索团队..." />
          <CommandList>
            <CommandEmpty>没有找到团队</CommandEmpty>
            <CommandGroup heading="我的团队">
              <TeamSwitcherItem
                v-for="team in teamStore.teams"
                :key="team.id"
                :team="team"
                @select-team="handleSelectTeam"
                @open-team-settings="handleOpenTeamSettings"
              />
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem value="create-team" class="gap-2" @select="handleCreateTeam">
                <div class="flex h-5 w-5 items-center justify-center rounded-full border border-dashed">
                  <Plus class="h-3 w-3" />
                </div>
                <span class="font-medium">创建团队</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <TeamSettingsSheet
      v-if="selectedTeamForSettings"
      v-model:open="isTeamSettingsOpen"
      :team="selectedTeamForSettings"
    />
  </div>
</template>
