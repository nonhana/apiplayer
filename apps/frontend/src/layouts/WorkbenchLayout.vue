<script lang="ts" setup>
import { useRouteParams } from '@vueuse/router'
import { onUnmounted, watch } from 'vue'
import ApiSidebar from '@/components/workbench/ApiSidebar.vue'
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader.vue'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTabStore } from '@/stores/useTabStore'

const projectId = useRouteParams<string>('projectId')

const tabStore = useTabStore()
const apiTreeStore = useApiTreeStore()
const projectStore = useProjectStore()

// projectId 变化，更新项目数据
watch(projectId, (newV) => {
  if (newV) {
    apiTreeStore.setProjectId(newV)
    projectStore.setProjectId(newV)
    projectStore.init()
  }
}, { immediate: true })

// 离开页面时清空所有 Store
onUnmounted(() => {
  apiTreeStore.reset()
  tabStore.reset()
  projectStore.reset()
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-background text-foreground">
    <WorkbenchHeader />
    <div class="flex flex-1">
      <ApiSidebar />
      <router-view />
    </div>
  </div>
</template>
