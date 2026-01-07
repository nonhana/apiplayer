<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import RunnerParamTable from '../RunnerParamTable.vue'

const runnerStore = useApiRunnerStore()
const { pathParams, queryParams } = storeToRefs(runnerStore)
const { addQueryParam, removeQueryParam, updateQueryParam, updatePathParam } = runnerStore

const hasPathParams = computed(() => pathParams.value.length > 0)
</script>

<template>
  <div class="space-y-6 p-4">
    <div v-if="hasPathParams" class="space-y-2">
      <h4 class="text-sm font-medium text-muted-foreground">
        路径参数 (Path)
      </h4>
      <RunnerParamTable
        :params="pathParams"
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
        :params="queryParams"
        name-placeholder="参数名"
        value-placeholder="参数值"
        @add="addQueryParam"
        @remove="removeQueryParam"
        @update="updateQueryParam"
      />
    </div>
  </div>
</template>
