<script lang="ts" setup>
import type { RuntimeParam } from '@/types/proxy'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import RunnerParamTable from '../RunnerParamTable.vue'

const runnerStore = useApiRunnerStore()

/** 更新请求头 */
function updateHeader(index: number, key: keyof RuntimeParam, value: string | boolean) {
  const header = runnerStore.headers[index]
  if (header) {
    (header as Record<string, unknown>)[key] = value
  }
}
</script>

<template>
  <div class="p-4">
    <RunnerParamTable
      :params="runnerStore.headers"
      :editable-name="true"
      :show-add="true"
      name-placeholder="Header 名称"
      value-placeholder="Header 值"
      @add="runnerStore.addHeader"
      @remove="runnerStore.removeHeader"
      @update="updateHeader"
    />
  </div>
</template>
