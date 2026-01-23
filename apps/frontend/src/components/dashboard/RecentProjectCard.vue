<script lang="ts" setup>
import type { RecentProjectItem } from '@/types/project'
import { Clock } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import dayjs from '@/lib/dayjs'
import { getAbbreviation } from '@/lib/utils'

const props = defineProps<{
  project: RecentProjectItem
}>()

const router = useRouter()

const lastVisitedAt = computed(() => dayjs(props.project.lastVisitedAt).fromNow())

function handleEnterProject() {
  router.push({
    name: 'Workbench',
    params: { projectId: props.project.id },
  })
}
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          class="w-50 h-22 flex flex-col justify-between p-3 rounded-lg border bg-card text-left transition-all hover:border-primary/20 hover:bg-accent/50"
          @click="handleEnterProject"
        >
          <div class="flex items-center gap-2">
            <Avatar class="h-8 w-8 rounded-md border shadow-sm">
              <AvatarImage v-if="project.icon" :src="project.icon" />
              <AvatarFallback class="rounded-md text-xs font-bold bg-linear-to-br from-primary/20 to-primary/5 text-primary">
                {{ getAbbreviation(project.name, 'P') }}
              </AvatarFallback>
            </Avatar>
            <div>
              <span class="text-sm font-medium truncate">{{ project.name }}</span>
              <p class="text-xs text-muted-foreground truncate">
                {{ project.team.name }}
              </p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground flex items-center gap-1">
            <Clock class="h-3 w-3" />
            {{ lastVisitedAt }}
          </p>
        </button>
      </TooltipTrigger>
      <TooltipContent v-if="project.description" side="bottom" class="max-w-75">
        {{ project.description }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
