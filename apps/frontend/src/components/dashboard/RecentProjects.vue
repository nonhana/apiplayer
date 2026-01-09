<script lang="ts" setup>
import type { RecentProjectItem } from '@/types/project'
import { ArrowRight, Clock, Globe, Lock } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { projectApi } from '@/api/project'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import dayjs from '@/lib/dayjs'
import { getAbbreviation } from '@/lib/utils'

const router = useRouter()

const recentProjects = ref<RecentProjectItem[]>([])
const isLoading = ref(true)

const getLastVisitedAt = (date: string) => dayjs(date).fromNow()

const hasRecentProjects = computed(() => recentProjects.value.length > 0)

function handleEnterProject(projectId: string) {
  router.push({ name: 'Workbench', params: { projectId } })
}

async function fetchRecentProjects() {
  isLoading.value = true
  try {
    recentProjects.value = await projectApi.getRecentProjects()
  }
  catch (error) {
    console.error('获取最近访问项目错误', error)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRecentProjects()
})

defineExpose({
  refresh: fetchRecentProjects,
})
</script>

<template>
  <Card v-if="isLoading || hasRecentProjects">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Clock class="h-4 w-4 text-muted-foreground" />
          <CardTitle class="text-base">
            最近访问
          </CardTitle>
        </div>
        <CardDescription class="text-xs">
          快速回到您的工作
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <ScrollArea v-if="isLoading" class="w-full">
        <div class="flex gap-3 pb-2">
          <div
            v-for="i in 4"
            :key="i"
            class="shrink-0 w-50 p-3 rounded-lg border bg-card"
          >
            <div class="flex items-center gap-2 mb-2">
              <Skeleton class="h-8 w-8 rounded-md" />
              <div class="flex-1 space-y-1">
                <Skeleton class="h-4 w-24" />
                <Skeleton class="h-3 w-16" />
              </div>
            </div>
            <Skeleton class="h-3 w-full" />
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <ScrollArea v-else class="w-full">
        <div class="flex gap-3 pb-2">
          <TooltipProvider v-for="project in recentProjects" :key="project.id">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="shrink-0 w-50 p-3 rounded-lg border bg-card text-left transition-all hover:shadow-sm hover:border-primary/20 hover:bg-accent/50 group"
                  @click="handleEnterProject(project.id)"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <Avatar class="h-8 w-8 rounded-md border shadow-sm">
                      <AvatarImage v-if="project.icon" :src="project.icon" />
                      <AvatarFallback class="rounded-md text-xs font-bold bg-linear-to-br from-primary/20 to-primary/5 text-primary">
                        {{ getAbbreviation(project.name, 'P') }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="text-sm font-medium truncate">{{ project.name }}</span>
                        <Badge
                          :variant="project.isPublic ? 'secondary' : 'outline'"
                          class="shrink-0 h-4 w-4 p-0 flex items-center justify-center"
                        >
                          <Globe v-if="project.isPublic" class="h-2.5 w-2.5" />
                          <Lock v-else class="h-2.5 w-2.5" />
                        </Badge>
                      </div>
                      <p class="text-xs text-muted-foreground truncate">
                        {{ project.team.name }}
                      </p>
                    </div>
                  </div>
                  <p class="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    {{ getLastVisitedAt(project.lastVisitedAt) }}
                  </p>

                  <!-- Hover 时显示箭头 -->
                  <ArrowRight class="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </TooltipTrigger>
              <TooltipContent v-if="project.description" side="bottom" class="max-w-75">
                {{ project.description }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </CardContent>
  </Card>
</template>
