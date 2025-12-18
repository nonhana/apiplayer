<script lang="ts" setup>
import { useRouteParams } from '@vueuse/router'
import { onUnmounted, watch } from 'vue'
import ApiSidebar from '@/components/workbench/ApiSidebar.vue'
import WorkbenchHeader from '@/components/workbench/WorkbenchHeader.vue'
import { useApiTreeStore } from '@/stores/useApiTreeStore'
import { useTabStore } from '@/stores/useTabStore'

const tabStore = useTabStore()
const apiTreeStore = useApiTreeStore()
const projectId = useRouteParams<string>('projectId')

/** 监听路由变化，更新当前项目 */
watch(projectId, (newV) => {
  if (newV) {
    apiTreeStore.setProjectId(newV)
  }
}, { immediate: true })

/** 组件卸载时重置状态 */
onUnmounted(() => {
  apiTreeStore.reset()
  tabStore.reset()
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-background text-foreground">
    <WorkbenchHeader />
    <div class="flex">
      <ApiSidebar />
      <router-view />
    </div>
  </div>
</template>
