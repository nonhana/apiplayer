<script lang="ts" setup>
import { RefreshCcw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { utilApi } from '@/api/util'
import CodeEditor from '@/components/common/CodeEditor.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { REQUEST_BODY_TYPES, requestBodyTypeLabels } from '@/constants/api'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import RunnerParamTable from '../RunnerParamTable.vue'

const runnerStore = useApiRunnerStore()
const { body } = storeToRefs(runnerStore)
const {
  setBodyType,
  setJsonContent,
  setRawContent,
  addFormField,
  removeFormField,
  updateFormField,
} = runnerStore

const bodyType = computed({
  get: () => body.value.type,
  set: (val) => {
    setBodyType(val)
  },
})

const jsonContent = computed({
  get: () => body.value.jsonContent ?? '{}',
  set: val => setJsonContent(val),
})

const rawContent = computed({
  get: () => body.value.rawContent ?? '',
  set: val => setRawContent(val),
})

async function handleAutoMock() {
  if (!body.value.jsonSchema)
    return

  try {
    const res = await utilApi.getSchemaMock(body.value.jsonSchema)
    setJsonContent(JSON.stringify(res, null, 2))
  }
  catch (error) {
    console.error('自动 Mock 失败', error)
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center gap-4">
      <Label class="text-muted-foreground">类型</Label>
      <Select v-model="bodyType">
        <SelectTrigger class="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="type in REQUEST_BODY_TYPES"
            :key="type"
            :value="type"
          >
            {{ requestBodyTypeLabels[type] }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        v-if="bodyType === 'json'"
        size="sm"
        class="ml-auto"
        @click="handleAutoMock"
      >
        <RefreshCcw class="h-4 w-4" />
        自动 Mock
      </Button>
    </div>

    <div v-if="bodyType === 'none'" class="py-8 text-center text-muted-foreground">
      该请求无请求体
    </div>

    <div v-else-if="bodyType === 'json'" class="space-y-2">
      <CodeEditor v-model="jsonContent" language="json" />
      <p class="text-xs text-muted-foreground">
        提示：输入有效的 JSON 格式数据
      </p>
    </div>

    <div v-else-if="bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded'">
      <RunnerParamTable
        :params="body.formData ?? []"
        :editable-name="true"
        :show-add="true"
        name-placeholder="字段名"
        value-placeholder="字段值"
        @add="addFormField"
        @remove="removeFormField"
        @update="updateFormField"
      />
    </div>

    <div v-else-if="bodyType === 'raw'" class="space-y-2">
      <CodeEditor v-model="rawContent" language="plaintext" />
    </div>

    <div v-else-if="bodyType === 'binary'" class="py-8 text-center text-muted-foreground">
      二进制文件上传功能开发中...
    </div>
  </div>
</template>
