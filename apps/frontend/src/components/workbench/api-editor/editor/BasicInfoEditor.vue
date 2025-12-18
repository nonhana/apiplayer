<script lang="ts" setup>
import type { ApiBaseInfoForm } from './types'
import type { ApiStatus, HttpMethod } from '@/types/api'
import { computed, ref, watch } from 'vue'
import UserSearchSelect from '@/components/dashboard/UserSearchSelect.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  API_STATUSES,
  HTTP_METHODS,
  methodBadgeColors,
  statusColors,
  statusLabels,
} from '@/constants/api'
import { cn } from '@/lib/utils'
import TagsInput from './TagsInput.vue'

const props = withDefaults(defineProps<{
  /** 基本信息数据 */
  info: ApiBaseInfoForm
  /** 是否禁用 */
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:info', info: ApiBaseInfoForm): void
}>()

/** 内部数据 */
const internalInfo = ref<ApiBaseInfoForm>({
  name: '',
  method: 'GET',
  path: '',
  status: 'DRAFT',
  tags: [],
})

/** 同步外部数据 */
watch(
  () => props.info,
  (newInfo) => {
    internalInfo.value = { ...newInfo }
  },
  { immediate: true, deep: true },
)

/** 通知变化 */
function emitChange() {
  emit('update:info', { ...internalInfo.value })
}

/** 更新字段 */
function updateField<K extends keyof ApiBaseInfoForm>(key: K, value: ApiBaseInfoForm[K]) {
  if (props.disabled)
    return

  internalInfo.value[key] = value
  emitChange()
}

/** 当前方法的样式类 */
const curMethodClass = computed(() => {
  return methodBadgeColors[internalInfo.value.method] ?? 'bg-slate-500/15 text-slate-600'
})

/** 当前状态的样式类 */
const curStatusClass = computed(() => {
  return statusColors[internalInfo.value.status] ?? 'bg-slate-500/15 text-slate-600'
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <Label for="api-name">
        接口名称 <span class="text-destructive">*</span>
      </Label>
      <Input
        id="api-name"
        :model-value="internalInfo.name"
        placeholder="请输入接口名称"
        :disabled="disabled"
        class="font-medium"
        @update:model-value="updateField('name', String($event))"
      />
    </div>

    <div class="flex gap-3">
      <div class="w-[130px] space-y-2">
        <Label for="api-method">
          请求方法 <span class="text-destructive">*</span>
        </Label>
        <Select
          :model-value="internalInfo.method"
          :disabled="disabled"
          @update:model-value="updateField('method', $event as HttpMethod)"
        >
          <SelectTrigger id="api-method" :class="cn('font-bold', curMethodClass)">
            <SelectValue>{{ internalInfo.method }}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="method in HTTP_METHODS"
              :key="method"
              :value="method"
            >
              <span :class="cn('font-bold', methodBadgeColors[method])">
                {{ method }}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex-1 space-y-2">
        <Label for="api-path">
          接口路径 <span class="text-destructive">*</span>
        </Label>
        <Input
          id="api-path"
          :model-value="internalInfo.path"
          placeholder="/api/example"
          :disabled="disabled"
          class="font-mono"
          @update:model-value="updateField('path', String($event))"
        />
      </div>
    </div>

    <div class="flex gap-3">
      <div class="w-[200px] space-y-2">
        <Label for="api-status">接口状态</Label>
        <Select
          :model-value="internalInfo.status"
          :disabled="disabled"
          @update:model-value="updateField('status', $event as ApiStatus)"
        >
          <SelectTrigger id="api-status" :class="curStatusClass">
            <SelectValue>{{ statusLabels[internalInfo.status] }}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="status in API_STATUSES"
              :key="status"
              :value="status"
            >
              <span :class="statusColors[status]">
                {{ statusLabels[status] }}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex-1 space-y-2">
        <Label for="api-owner">负责人</Label>
        <UserSearchSelect
          :model-value="internalInfo.ownerId"
          :multiple="false"
          :disabled="disabled"
          @update:model-value="updateField('ownerId', $event as string)"
        />
      </div>
    </div>

    <div class="space-y-2">
      <Label for="api-description">接口描述</Label>
      <Textarea
        id="api-description"
        :model-value="internalInfo.description"
        placeholder="请输入接口描述（可选）"
        :disabled="disabled"
        rows="3"
        class="resize-none"
        @update:model-value="updateField('description', String($event))"
      />
    </div>

    <div class="space-y-2">
      <Label>标签</Label>
      <TagsInput
        :tags="internalInfo.tags"
        :disabled="disabled"
        placeholder="输入标签后按回车添加"
        @update:tags="updateField('tags', $event)"
      />
    </div>
  </div>
</template>
