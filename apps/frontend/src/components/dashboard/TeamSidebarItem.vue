<script lang="ts" setup>
import type { TeamItem } from '@/types/team'
import { Settings, Users } from 'lucide-vue-next'
import { computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, getAbbreviation } from '@/lib/utils'
import { useTeamStore } from '@/stores/useTeamStore'

const props = defineProps<{
  team: TeamItem
}>()

const emits = defineEmits<{
  (e: 'selectTeam', teamId: string): void
  (e: 'openTeamSettings', team: TeamItem, event: Event): void
}>()

const teamStore = useTeamStore()

const isActive = computed(() => teamStore.curTeamId === props.team.id)
</script>

<template>
  <button
    type="button"
    class="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-accent/60"
    :class="cn(isActive && 'bg-accent text-accent-foreground')"
    @click="emits('selectTeam', team.id)"
  >
    <Avatar class="h-8 w-8 border">
      <AvatarImage v-if="team.avatar" :src="team.avatar" />
      <AvatarFallback class="text-xs font-semibold bg-primary/10 text-primary">
        {{ getAbbreviation(team.name, 'T') }}
      </AvatarFallback>
    </Avatar>
    <div class="flex-1 min-w-0">
      <div class="truncate text-sm font-medium">
        {{ team.name }}
      </div>
      <div class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <Users class="h-3 w-3" />
        <span>{{ team.memberCount }} 人</span>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="h-7 w-7 text-muted-foreground opacity-0 transition group-hover:opacity-100"
      @click.stop="emits('openTeamSettings', team, $event)"
    >
      <Settings class="h-4 w-4" />
    </Button>
  </button>
</template>
