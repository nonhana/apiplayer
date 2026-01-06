<script lang="ts" setup>
import type { RuntimeParam } from '@/types/proxy'
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

/** 当前请求体类型 */
const bodyType = computed({
  get: () => body.value.type,
  set: (val) => {
    runnerStore.setBodyType(val as typeof body.value.type)
  },
})

/** JSON 内容 */
const jsonContent = computed({
  get: () => body.value.jsonContent ?? '{}',
  set: val => runnerStore.setJsonContent(val),
})

/** Raw 内容 */
const rawContent = computed({
  get: () => body.value.rawContent ?? '',
  set: val => runnerStore.setRawContent(val),
})

/** 更新表单字段 */
function updateFormField(index: number, key: keyof RuntimeParam, value: string | boolean) {
  const field = body.value.formData?.[index]
  if (field) {
    (field as Record<string, unknown>)[key] = value
  }
}

async function handleAutoMock() {
  if (!body.value.jsonSchema)
    return

  try {
    const res = await utilApi.getSchemaMock(body.value.jsonSchema)
    runnerStore.setJsonContent(JSON.stringify(res, null, 2))
  }
  catch (error) {
    console.error('自动 Mock 失败', error)
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- 类型选择 -->
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

    <!-- none 类型 -->
    <div v-if="bodyType === 'none'" class="py-8 text-center text-muted-foreground">
      该请求无请求体
    </div>

    <!-- JSON 编辑器 -->
    <div v-else-if="bodyType === 'json'" class="space-y-2">
      <CodeEditor v-model="jsonContent" language="json" />
      <p class="text-xs text-muted-foreground">
        提示：输入有效的 JSON 格式数据
      </p>
    </div>

    <!-- form-data / x-www-form-urlencoded -->
    <div v-else-if="bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded'">
      <RunnerParamTable
        :params="runnerStore.body.formData ?? []"
        :editable-name="true"
        :show-add="true"
        name-placeholder="字段名"
        value-placeholder="字段值"
        @add="runnerStore.addFormField"
        @remove="runnerStore.removeFormField"
        @update="updateFormField"
      />
    </div>

    <!-- raw -->
    <div v-else-if="bodyType === 'raw'" class="space-y-2">
      <CodeEditor v-model="rawContent" language="plaintext" />
    </div>

    <!-- binary -->
    <div v-else-if="bodyType === 'binary'" class="py-8 text-center text-muted-foreground">
      二进制文件上传功能开发中...
    </div>
  </div>
</template>
