<script lang="ts" setup>
import { onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ApiSidebar from '@/components/workbench/ApiSidebar.vue'
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader.vue'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useTabStore } from '@/stores/useTabStore'

const route = useRoute()
const tabStore = useTabStore()
const apiTreeStore = useApiTreeStore()

/** 监听路由变化，更新当前项目 */
watch(() => route.params, (params) => {
  const projectId = params.projectId
  if (projectId) {
    apiTreeStore.setProjectId(projectId as string)
  }
}, { immediate: true })

/** 组件卸载时重置状态 */
onUnmounted(() => {
  apiTreeStore.reset()
  tabStore.reset()
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
    <WorkbenchHeader />
    <div class="flex-1 flex overflow-hidden">
      <ApiSidebar />
      <router-view />
    </div>
  </div>
</template>
