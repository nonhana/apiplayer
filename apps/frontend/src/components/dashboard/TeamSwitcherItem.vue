<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { Check, Settings, Users } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CommandItem } from '@/components/ui/command'
import { cn, getAbbreviation } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'

defineProps<{
  team: TeamItem
}>()

const emits = defineEmits<{
  (e: 'selectTeam', teamId: string): void
  (e: 'openTeamSettings', team: TeamItem, event: Event): void
}>()

const teamStore = useTeamStore()
</script>

<template>
  <CommandItem
    :key="team.id"
    :value="team.name"
    class="gap-2 group"
    @select="emits('selectTeam', team.id)"
  >
    <Avatar class="h-5 w-5 border">
      <AvatarImage v-if="team.avatar" :src="team.avatar" />
      <AvatarFallback class="text-[10px] font-semibold bg-primary/10 text-primary">
        {{ getAbbreviation(team.name, 'T') }}
      </AvatarFallback>
    </Avatar>
    <span class="flex-1 truncate">{{ team.name }}</span>
    <div class="flex items-center gap-1 text-xs text-muted-foreground">
      <Users class="h-3 w-3" />
      <span>{{ team.memberCount }}</span>
    </div>
    <!-- 设置按钮 -->
    <Button
      variant="ghost"
      size="icon"
      class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      @click="emits('openTeamSettings', team, $event)"
    >
      <Settings class="h-3.5 w-3.5" />
    </Button>
    <Check
      :class="cn(
        'h-4 w-4 shrink-0',
        teamStore.curTeamId === team.id ? 'opacity-100' : 'opacity-0',
      )"
    />
  </CommandItem>
</template>
