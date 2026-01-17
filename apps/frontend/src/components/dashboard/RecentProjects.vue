<script lang="ts" setup>
import type { RecentProjectItem } from '@/types/project'
import { Clock } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { projectApi } from '@/api/project'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import RecentProjectCard from './RecentProjectCard.vue'

const recentProjects = ref<RecentProjectItem[]>([])
const isLoading = ref(true)

const hasRecentProjects = computed(() => recentProjects.value.length > 0)

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
            class="w-50 h-22 flex flex-col justify-between p-3 rounded-lg border bg-card"
          >
            <div class="flex items-center gap-2">
              <Skeleton class="h-8 w-8 rounded-md" />
              <div class="space-y-1">
                <Skeleton class="h-5 w-24" />
                <Skeleton class="h-4 w-16" />
              </div>
            </div>
            <Skeleton class="h-4 w-full" />
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <ScrollArea v-else class="w-full">
        <div class="flex gap-3 pb-2">
          <RecentProjectCard
            v-for="project in recentProjects"
            :key="project.id"
            :project="project"
          />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </CardContent>
  </Card>
</template>
