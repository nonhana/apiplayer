<script lang="ts" setup>
import { computed } from 'vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()

const formattedBody = computed(() => {
  const body = runnerStore.response?.body ?? ''

  try {
    const parsed = JSON.parse(body)
    return JSON.stringify(parsed, null, 2)
  }
  catch (error) {
    console.error('JSON 解析失败', error)
    return body
  }
})

const isJson = computed(() => {
  const contentType = runnerStore.response?.headers?.['content-type'] ?? ''
  return contentType.includes('application/json')
})
</script>

<template>
  <div class="m-2">
    <CodeBlock :code="formattedBody" :lang="isJson ? 'json' : 'plaintext'" />
  </div>
</template>
