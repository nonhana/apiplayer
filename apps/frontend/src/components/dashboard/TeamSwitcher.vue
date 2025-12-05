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
import { getTeamFallbackIcon } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'
import TeamSettingsSheet from './TeamSettingsSheet.vue'
import TeamSwitcherItem from './TeamSwitcherItem.vue'

const emits = defineEmits<{
  (e: 'createTeam'): void
}>()

const teamStore = useTeamStore()

const isOpen = ref(false)

// 团队设置抽屉状态
const isTeamSettingsOpen = ref(false)
const selectedTeamForSettings = ref<TeamItem | null>(null)

/** 当前团队显示名 */
const currentTeamName = computed(() => teamStore.currentTeam?.name ?? '选择团队')

/** 当前团队的兜底 Icon */
const currentTeamFallbackIcon = computed(() =>
  teamStore.currentTeam ? getTeamFallbackIcon(teamStore.currentTeam.name) : 'T',
)

/** 切换团队 */
function handleSelectTeam(teamId: string) {
  teamStore.switchTeam(teamId)
  isOpen.value = false
}

/** 打开创建团队对话框 */
function handleCreateTeam() {
  isOpen.value = false
  emits('createTeam')
}

/** 打开团队设置 */
function handleOpenTeamSettings(team: TeamItem, event: Event) {
  event.stopPropagation()
  isOpen.value = false
  selectedTeamForSettings.value = team
  isTeamSettingsOpen.value = true
}

/** 页面加载时获取团队列表 */
watch(
  () => teamStore.teams.length,
  (length) => {
    if (length === 0 && !teamStore.isLoading) {
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
          class="w-[200px] justify-between gap-2"
        >
          <template v-if="teamStore.isLoading">
            <Skeleton class="h-5 w-5 rounded-full" />
            <Skeleton class="h-4 flex-1" />
          </template>
          <template v-else>
            <Avatar class="h-5 w-5 border">
              <AvatarImage v-if="teamStore.currentTeam?.avatar" :src="teamStore.currentTeam.avatar" />
              <AvatarFallback class="text-[10px] font-semibold bg-primary/10 text-primary">
                {{ currentTeamFallbackIcon }}
              </AvatarFallback>
            </Avatar>
            <span class="flex-1 truncate text-left font-medium">{{ currentTeamName }}</span>
            <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
          </template>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[240px] p-0" align="start">
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

    <!-- 团队设置抽屉 -->
    <TeamSettingsSheet
      v-if="selectedTeamForSettings"
      v-model:open="isTeamSettingsOpen"
      :team="selectedTeamForSettings"
    />
  </div>
</template>
