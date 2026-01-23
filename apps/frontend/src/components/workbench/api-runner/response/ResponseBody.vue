<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import CodeBlock from '@/components/common/CodeBlock.vue'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()
const { response } = storeToRefs(runnerStore)

const formattedBody = computed(() => {
  const body = response.value?.body ?? ''

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
  const contentType = response.value?.headers?.['content-type'] ?? ''
  return contentType.includes('application/json')
})
</script>

<template>
  <CodeBlock :code="formattedBody" :lang="isJson ? 'json' : 'plaintext'" />
</template>
