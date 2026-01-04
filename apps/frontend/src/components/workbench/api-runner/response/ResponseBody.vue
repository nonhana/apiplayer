<script lang="ts" setup>
import { computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()

const formattedBody = computed(() => {
  const body = runnerStore.response?.body ?? ''

  try {
    const parsed = JSON.parse(body)
    return JSON.stringify(parsed, null, 2)
  }
  catch {
    return body
  }
})

const isJson = computed(() => {
  const contentType = runnerStore.response?.headers?.['content-type'] ?? ''
  return contentType.includes('application/json')
})
</script>

<template>
  <ScrollArea class="h-full">
    <div class="p-4">
      <Textarea
        :model-value="formattedBody"
        readonly
        class="font-mono text-sm min-h-[300px] resize-none" :class="[
          isJson ? 'text-emerald-600 dark:text-emerald-400' : '',
        ]"
        placeholder="响应内容将在这里显示..."
      />
    </div>
  </ScrollArea>
</template>
