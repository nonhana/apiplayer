<script lang="ts" setup>
import type { RuntimeParam } from '@/types/proxy'
import { computed } from 'vue'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import RunnerParamTable from '../RunnerParamTable.vue'

const runnerStore = useApiRunnerStore()

const hasPathParams = computed(() => runnerStore.pathParams.length > 0)

function updatePathParam(index: number, key: keyof RuntimeParam, value: string | boolean) {
  const param = runnerStore.pathParams[index]
  if (param) {
    (param as Record<string, unknown>)[key] = value
  }
}

function updateQueryParam(index: number, key: keyof RuntimeParam, value: string | boolean) {
  const param = runnerStore.queryParams[index]
  if (param) {
    (param as Record<string, unknown>)[key] = value
  }
}
</script>

<template>
  <div class="space-y-6 p-4">
    <div v-if="hasPathParams" class="space-y-2">
      <h4 class="text-sm font-medium text-muted-foreground">
        路径参数 (Path)
      </h4>
      <RunnerParamTable
        :params="runnerStore.pathParams"
        value-placeholder="填写路径参数值"
        @update="updatePathParam"
      />
    </div>

    <div class="space-y-2">
      <h4 class="text-sm font-medium text-muted-foreground">
        查询参数 (Query)
      </h4>
      <RunnerParamTable
        show-add
        editable-name
        :params="runnerStore.queryParams"
        name-placeholder="参数名"
        value-placeholder="参数值"
        @add="runnerStore.addQueryParam"
        @remove="runnerStore.removeQueryParam"
        @update="updateQueryParam"
      />
    </div>
  </div>
</template>
