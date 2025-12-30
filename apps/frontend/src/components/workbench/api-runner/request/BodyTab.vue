<script lang="ts" setup>
import type { RuntimeParam } from '@/types/proxy'
import { computed } from 'vue'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { REQUEST_BODY_TYPES, requestBodyTypeLabels } from '@/constants/api'
import { useApiRunnerStore } from '@/stores/useApiRunnerStore'
import RunnerParamTable from '../RunnerParamTable.vue'

const runnerStore = useApiRunnerStore()

/** 当前请求体类型 */
const bodyType = computed({
  get: () => runnerStore.body.type,
  set: (val) => {
    runnerStore.setBodyType(val as typeof runnerStore.body.type)
  },
})

/** JSON 内容 */
const jsonContent = computed({
  get: () => runnerStore.body.jsonContent ?? '{}',
  set: val => runnerStore.setJsonContent(val),
})

/** Raw 内容 */
const rawContent = computed({
  get: () => runnerStore.body.rawContent ?? '',
  set: val => runnerStore.setRawContent(val),
})

/** 更新表单字段 */
function updateFormField(index: number, key: keyof RuntimeParam, value: string | boolean) {
  const field = runnerStore.body.formData?.[index]
  if (field) {
    (field as Record<string, unknown>)[key] = value
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
    </div>

    <!-- none 类型 -->
    <div v-if="bodyType === 'none'" class="py-8 text-center text-muted-foreground">
      该请求无请求体
    </div>

    <!-- JSON 编辑器 -->
    <div v-else-if="bodyType === 'json'" class="space-y-2">
      <Textarea
        v-model="jsonContent"
        placeholder="{&quot;key&quot;: &quot;value&quot;}"
        class="font-mono text-sm min-h-[200px] resize-y"
      />
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
      <Textarea
        v-model="rawContent"
        placeholder="输入原始请求体内容..."
        class="font-mono text-sm min-h-[200px] resize-y"
      />
    </div>

    <!-- binary -->
    <div v-else-if="bodyType === 'binary'" class="py-8 text-center text-muted-foreground">
      二进制文件上传功能开发中...
    </div>
  </div>
</template>
