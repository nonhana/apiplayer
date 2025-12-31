<script lang="ts" setup>
import type { ApiDetail } from '@/types/api'
import { onUnmounted, watch } from 'vue'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import RequestPanel from './RequestPanel.vue'
import ResponsePanel from './ResponsePanel.vue'
import RunnerToolbar from './RunnerToolbar.vue'

const props = defineProps<{
  api: ApiDetail
}>()

const runnerStore = useApiRunnerStore()

watch(() => props.api.id, () => {
  runnerStore.initFromApiDetail(props.api)
}, { immediate: true })

onUnmounted(() => {
  runnerStore.reset()
})
</script>

<template>
  <div class="h-full flex flex-col bg-background">
    <RunnerToolbar />
    <div class="flex flex-col p-4 gap-4">
      <RequestPanel />
      <ResponsePanel />
    </div>
  </div>
</template>
