<script lang="ts" setup>
import { useRouteParams } from '@vueuse/router'
import { onUnmounted, watch } from 'vue'
import ApiSidebar from '@/components/workbench/ApiSidebar.vue'
import WorkbenchSidebar from '@/components/workbench/WorkbenchSidebar.vue'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTabStore } from '@/stores/useTabStore'
import { useWorkbenchResourceStore } from '@/stores/useWorkbenchResourceStore'

const projectId = useRouteParams<string>('projectId')

const tabStore = useTabStore()
const apiTreeStore = useApiTreeStore()
const projectStore = useProjectStore()
const workbenchResourceStore = useWorkbenchResourceStore()

// projectId 变化，更新项目数据
watch(projectId, (newV, oldV) => {
  if (newV && newV !== oldV) {
    workbenchResourceStore.reset()
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
  workbenchResourceStore.reset()
})
</script>

<template>
  <div class="h-full flex bg-background text-foreground">
    <WorkbenchSidebar />
    <ApiSidebar />
    <router-view />
  </div>
</template>
