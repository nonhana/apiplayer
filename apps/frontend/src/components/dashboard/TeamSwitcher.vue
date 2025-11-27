<script lang="ts" setup>
import { Check, ChevronsUpDown, Plus, Users } from 'lucide-vue-next'
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
import { cn } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'

const emits = defineEmits<{
  (e: 'createTeam'): void
}>()

const teamStore = useTeamStore()

const isOpen = ref(false)

/** 获取团队头像 Fallback */
function getTeamInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return (parts[0]?.charAt(0) ?? 'T').toUpperCase()
  }
  return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || 'T'
}

/** 当前团队显示名 */
const currentTeamName = computed(() => teamStore.currentTeam?.name ?? '选择团队')

/** 当前团队显示的 initials */
const currentTeamInitials = computed(() =>
  teamStore.currentTeam ? getTeamInitials(teamStore.currentTeam.name) : 'T',
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
              {{ currentTeamInitials }}
            </AvatarFallback>
          </Avatar>
          <span class="flex-1 truncate text-left font-medium">{{ currentTeamName }}</span>
          <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command>
        <CommandInput placeholder="搜索团队..." />
        <CommandList>
          <CommandEmpty>没有找到团队</CommandEmpty>
          <CommandGroup heading="我的团队">
            <CommandItem
              v-for="team in teamStore.teams"
              :key="team.id"
              :value="team.name"
              class="gap-2"
              @select="handleSelectTeam(team.id)"
            >
              <Avatar class="h-5 w-5 border">
                <AvatarImage v-if="team.avatar" :src="team.avatar" />
                <AvatarFallback class="text-[10px] font-semibold bg-primary/10 text-primary">
                  {{ getTeamInitials(team.name) }}
                </AvatarFallback>
              </Avatar>
              <span class="flex-1 truncate">{{ team.name }}</span>
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                <Users class="h-3 w-3" />
                <span>{{ team.memberCount }}</span>
              </div>
              <Check
                :class="cn(
                  'h-4 w-4 shrink-0',
                  teamStore.currentTeamId === team.id ? 'opacity-100' : 'opacity-0',
                )"
              />
            </CommandItem>
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
</template>
