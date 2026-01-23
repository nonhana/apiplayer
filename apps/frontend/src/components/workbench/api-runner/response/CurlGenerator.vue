<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import CodeBlock from '@/components/common/CodeBlock.vue'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'

const runnerStore = useApiRunnerStore()
const { curlCommand } = storeToRefs(runnerStore)
</script>

<template>
  <CodeBlock
    :code="curlCommand"
    lang="shellscript"
    title="根据当前配置生成的 cURL 命令"
  />
</template>
