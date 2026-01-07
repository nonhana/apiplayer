<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import RunnerParamTable from '../RunnerParamTable.vue'

const runnerStore = useApiRunnerStore()
const { headers } = storeToRefs(runnerStore)
const { addHeader, removeHeader, updateHeader } = runnerStore
</script>

<template>
  <div class="p-4">
    <RunnerParamTable
      :params="headers"
      :editable-name="true"
      :show-add="true"
      name-placeholder="Header 名称"
      value-placeholder="Header 值"
      @add="addHeader"
      @remove="removeHeader"
      @update="updateHeader"
    />
  </div>
</template>
